"""
Battles - WebSocket Consumer
==============================
Handles the real-time battle room: timer sync, live code submission,
scoreboard broadcast, and battle end.

Connection: ws://host/ws/battles/<battle_id>/?token=<jwt>
Group name: battle_<battle_id>

Message types sent TO client:
  - battle_state      : initial state on connect
  - scoreboard_update : live score change
  - submission_result : result of a user's code run
  - timer_tick        : remaining seconds (every 5 s)
  - battle_ended      : final scores + winner

Message types received FROM client:
  - submit            : { problem_id, code, language }
"""

import asyncio
import json
import logging

from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone

logger = logging.getLogger("apps")

TICK_INTERVAL = 5  # seconds between timer broadcasts


class BattleConsumer(AsyncWebsocketConsumer):
    """Real-time battle room WebSocket consumer."""

    # ── Connect ──────────────────────────────────────────────────────────────

    async def connect(self):
        user = self.scope.get("user")
        if not user or user.is_anonymous:
            await self.close(code=4001)
            return

        self.battle_id  = self.scope["url_route"]["kwargs"]["battle_id"]
        self.group_name = f"battle_{self.battle_id}"
        self.user       = user
        self._timer_task = None

        # Verify the user is a participant
        battle = await self._get_battle()
        if not battle:
            await self.close(code=4004)
            return

        is_participant = await self._is_participant(battle)
        if not is_participant:
            await self.close(code=4003)
            return

        # Join the WS group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Mark this user as connected; if both are connected → start timer
        await self._mark_connected()
        both_connected = await self._both_connected(battle)
        if both_connected:
            # _try_activate_battle uses an atomic filter(status='waiting').update()
            # so only ONE of the two concurrent connections will get activated=True
            # and only that one starts the timer (prevents duplicate timers).
            activated, battle = await self._try_activate_battle()
            if activated:
                self._timer_task = asyncio.create_task(self._run_timer(battle))
                # Broadcast the now-active battle state to EVERYONE in the group
                # (the other user is already connected and waiting on 'waiting' state)
                await self._broadcast_battle_state(battle)
            else:
                # Re-fetch battle so we have the freshest status for _send_battle_state
                battle = await self._get_battle()

        # Send initial battle state to this client only
        await self._send_battle_state(battle)

        logger.info("Battle WS connected: user=%s battle=%s", user.username, self.battle_id)

    # ── Disconnect ───────────────────────────────────────────────────────────

    async def disconnect(self, close_code):
        if self._timer_task:
            self._timer_task.cancel()

        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

        logger.info("Battle WS disconnected: user=%s code=%s", getattr(self, "user", "?"), close_code)

    # ── Receive from client ──────────────────────────────────────────────────

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        action = data.get("action")
        if action == "submit":
            await self._handle_submission(data)
        elif action == "request_end":
            await self._handle_request_end()
        elif action == "ping":
            await self.send(text_data=json.dumps({"type": "pong"}))

    # ── Group message handlers (called by channel layer) ─────────────────────

    async def send_battle_state(self, event):
        """Handle a group-broadcast battle_state (sent when battle activates)."""
        await self.send(text_data=json.dumps(event["payload"]))

    async def scoreboard_update(self, event):
        """Broadcast scoreboard change to this client."""
        await self.send(text_data=json.dumps({
            "type": "scoreboard_update",
            **event["payload"],
        }))

    async def submission_result(self, event):
        """Deliver a submission result to this client."""
        await self.send(text_data=json.dumps({
            "type": "submission_result",
            **event["payload"],
        }))

    async def battle_ended(self, event):
        """Notify client that battle is over."""
        await self.send(text_data=json.dumps({
            "type": "battle_ended",
            **event["payload"],
        }))
        # Close this client's WS after short delay
        await asyncio.sleep(1)
        await self.close()

    async def timer_tick(self, event):
        """Forward timer tick to client."""
        await self.send(text_data=json.dumps({
            "type": "timer_tick",
            "seconds_remaining": event["seconds_remaining"],
        }))

    # ── Timer task ───────────────────────────────────────────────────────────

    async def _run_timer(self, battle):
        """
        Runs in the background. Ticks every TICK_INTERVAL seconds.
        Ends the battle when time runs out.
        """
        try:
            while True:
                await asyncio.sleep(TICK_INTERVAL)

                # Re-fetch from DB to get accurate ends_at
                battle = await self._get_battle()
                if not battle or battle.status != "active":
                    break

                remaining = battle.seconds_remaining()

                # Broadcast tick to everyone in group
                await self.channel_layer.group_send(
                    self.group_name,
                    {"type": "timer_tick", "seconds_remaining": remaining},
                )

                if remaining <= 0:
                    # Time's up — end the battle
                    await sync_to_async(self._end_battle_sync)(battle)
                    break

        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error("Battle timer error: %s", exc)

    def _end_battle_sync(self, battle):
        """Sync wrapper around the service end_battle function."""
        from .services import end_battle
        end_battle(battle)

    async def _handle_request_end(self):
        """
        Client signals that all questions have been exhausted (per-question timers all expired).
        The first request_end from any participant that finds the battle still active wins.
        Uses the same atomic pattern as _try_activate_battle to prevent double-ending.
        """
        from .models import Battle as _Battle
        updated = await database_sync_to_async(
            lambda: _Battle.objects.filter(
                id=self.battle_id,
                status=_Battle.Status.ACTIVE,
            ).update(status=_Battle.Status.COMPLETED)
        )()
        if updated > 0:
            # We won the race — now compute scores and broadcast battle_ended
            battle = await self._get_battle()
            if battle:
                await sync_to_async(self._end_battle_sync_from_completed)(battle)

    def _end_battle_sync_from_completed(self, battle):
        """Re-compute winner and broadcast battle_ended for a battle already marked COMPLETED."""
        from .services import (
            BATTLE_WIN_POINTS,
            _broadcast_scoreboard,
        )
        from .models import BattleParticipant
        from apps.accounts.models import User
        from django.db.models import F
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        from django.utils import timezone

        participants = list(
            BattleParticipant.objects.select_related("user")
            .filter(battle=battle)
            .order_by("-score", "-problems_solved")
        )

        winner = None
        if participants:
            top    = participants[0]
            second = participants[1] if len(participants) > 1 else None
            if not second or top.score > second.score:
                winner = top.user

        battle.winner   = winner
        battle.ended_at = timezone.now()
        battle.save(update_fields=["winner", "ended_at"])

        # Update player stats
        participant_ids = [p.user_id for p in participants]
        User.objects.filter(id__in=participant_ids).update(
            battles_played=F("battles_played") + 1,
        )
        if winner:
            User.objects.filter(id=winner.id).update(
                battles_won=F("battles_won") + 1,
                rating=F("rating") + BATTLE_WIN_POINTS,
            )

        result_payload = {
            "battle_id": str(battle.id),
            "winner":    winner.username if winner else None,
            "is_draw":   winner is None,
            "scores": [
                {
                    "username":        p.user.username,
                    "score":           p.score,
                    "problems_solved": p.problems_solved,
                    "result": (
                        "win"  if winner and p.user_id == winner.id else
                        "draw" if winner is None else
                        "loss"
                    ),
                }
                for p in participants
            ],
            "ended_at": battle.ended_at.isoformat() if battle.ended_at else None,
        }
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"battle_{battle.id}",
            {"type": "battle_ended", "payload": result_payload},
        )
        logger.info("Battle %s force-ended (question timers). Winner: %s", battle.id, winner)

    # ── Submission handler ───────────────────────────────────────────────────

    async def _handle_submission(self, data: dict):
        """
        Receive a code submission from the client, run it through the sandbox,
        score it, and broadcast the result to the battle group.
        """
        problem_id = data.get("problem_id")
        code       = data.get("code", "")
        language   = data.get("language", "python")

        if not problem_id or not code:
            return

        # Run in thread pool (sandbox is sync)
        result = await sync_to_async(self._run_and_score)(problem_id, code, language)

        # Send result directly to this user
        await self.send(text_data=json.dumps({
            "type": "submission_result",
            **result,
        }))

    def _run_and_score(self, problem_id: str, code: str, language: str) -> dict:
        """Sync: run sandbox + call service layer. Returns JSON-serialisable dict."""
        from apps.problems.models import Problem
        from apps.judge.local_sandbox import LocalSandbox
        from .selectors import get_battle_by_id
        from .services import score_battle_submission

        try:
            battle  = get_battle_by_id(self.battle_id)
            problem = Problem.objects.prefetch_related("test_cases").get(id=problem_id)
        except Exception:
            return {"status": "error", "message": "Problem not found."}

        if not battle or battle.status != "active":
            return {"status": "error", "message": "Battle is not active."}

        if not battle.problems.filter(id=problem_id).exists():
            return {"status": "error", "message": "Problem not in this battle."}

        try:
            sandbox = LocalSandbox()
            result  = sandbox.run(
                code=code,
                language=language,
                test_cases=list(problem.test_cases.all()),
                time_limit_ms=problem.time_limit_ms,
                memory_limit_mb=problem.memory_limit_mb,
            )
        except Exception as exc:
            logger.error("Battle sandbox error: %s", exc)
            return {"status": "error", "message": "Execution failed."}

        sub = score_battle_submission(
            battle=battle,
            user=self.user,
            problem_id=problem_id,
            judge_status=result.get("status", "wrong_answer"),
            execution_time_ms=result.get("execution_time_ms"),
            memory_used_kb=result.get("memory_used_kb"),
            language=language,
            code=code,
            error_output=result.get("error", ""),
        )

        return {
            "problem_id":       str(problem_id),
            "status":           sub.status,
            "points_earned":    sub.points_earned,
            "execution_time_ms": sub.execution_time_ms,
        }

    # ── DB helpers ───────────────────────────────────────────────────────────

    @database_sync_to_async
    def _get_battle(self):
        from .selectors import get_battle_by_id
        return get_battle_by_id(self.battle_id)

    @database_sync_to_async
    def _is_participant(self, battle):
        return self.user in (battle.challenger, battle.opponent)

    @database_sync_to_async
    def _mark_connected(self):
        from .models import BattleParticipant
        BattleParticipant.objects.filter(
            battle_id=self.battle_id, user=self.user
        ).update(is_connected=True)

    @database_sync_to_async
    def _both_connected(self, battle):
        from .models import BattleParticipant
        return (
            BattleParticipant.objects
            .filter(battle_id=self.battle_id, is_connected=True)
            .count()
        ) >= 2

    @database_sync_to_async
    def _try_activate_battle(self):
        """
        Atomically activate the battle from 'waiting' → 'active'.
        Uses a filtered update so only the first concurrent caller succeeds.
        Returns (activated: bool, battle: Battle).
        """
        from .models import Battle
        from django.utils import timezone
        now = timezone.now()
        # Only update if still 'waiting'; returns 0 if already activated by the other user
        updated_count = Battle.objects.filter(
            id=self.battle_id,
            status=Battle.Status.WAITING,
        ).update(
            status=Battle.Status.ACTIVE,
            started_at=now,
            ends_at=now + timezone.timedelta(minutes=Battle.DURATION_MINUTES),
        )
        battle = Battle.objects.prefetch_related("problems", "participants__user").get(
            id=self.battle_id
        )
        return updated_count > 0, battle

    @database_sync_to_async
    def _activate_battle(self):
        """Set battle to ACTIVE and compute ends_at. (Legacy — prefer _try_activate_battle)"""
        from .models import Battle
        from django.utils import timezone
        now = timezone.now()
        Battle.objects.filter(id=self.battle_id).update(
            status=Battle.Status.ACTIVE,
            started_at=now,
            ends_at=now + timezone.timedelta(minutes=Battle.DURATION_MINUTES),
        )
        return Battle.objects.prefetch_related("problems", "participants__user").get(
            id=self.battle_id
        )

    async def _broadcast_battle_state(self, battle):
        """Push the full battle state to every client in the group (e.g. on activation)."""
        from .serializers import BattleDetailSerializer
        data = await sync_to_async(
            lambda: BattleDetailSerializer(battle).data
        )()
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "send_battle_state",
                "payload": {"type": "battle_state", **dict(data)},
            },
        )

    async def _send_battle_state(self, battle):
        """Send full initial state to the newly connected client only."""
        from .serializers import BattleDetailSerializer
        data = await sync_to_async(
            lambda: BattleDetailSerializer(battle).data
        )()
        await self.send(text_data=json.dumps({
            "type": "battle_state",
            **dict(data),
        }))
