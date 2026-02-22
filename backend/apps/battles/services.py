"""
Battles - Service Layer
========================
All business logic lives here. Views just call service functions.

Key responsibilities:
- Create / respond to battle requests
- Set up a battle (assign problems, create participant rows)
- Score a submission inside a battle
- End a battle (compute winner, update leaderboard stats)
- Broadcast real-time events via Django Channels
"""

import logging
import random

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone

from apps.accounts.models import User
from apps.problems.models import Problem
from .models import Battle, BattleParticipant, BattleRequest, BattleSubmission
from .selectors import (
    has_user_solved_problem,
)

logger = logging.getLogger("apps")

# Points awarded for solving a problem
PROBLEM_POINTS   = 10   # flat 10 pts per problem solved (first OR second solver)
BATTLE_WIN_POINTS = 20  # added to winner's global rating
BATTLE_DURATION_MIN = Battle.DURATION_MINUTES


# ─────────────────────────────────────────────────────────────────────────────
# Battle Request
# ─────────────────────────────────────────────────────────────────────────────

def send_battle_request(challenger: User, opponent: User, difficulty: str) -> BattleRequest:
    """
    Create a BattleRequest and notify the opponent via their notification WS channel.
    Raises ValueError for business-rule violations.
    """
    now = timezone.now()

    # 1. Auto-expire stale pending requests
    BattleRequest.objects.filter(
        status=BattleRequest.Status.PENDING,
        expires_at__lt=now,
    ).update(status=BattleRequest.Status.EXPIRED)

    # 2. Auto-cancel stale battles so users are never permanently locked:
    #    - WAITING battles older than 15 min (both users never connected in time)
    #    - ACTIVE battles past their ends_at (timer expired but server never finalised them)
    #    - ACTIVE battles with no ends_at but older than DURATION_MINUTES + 5 min buffer
    #      (covers server-restart orphans where ends_at was set but timer task is gone)
    stale_waiting_cutoff = now - timezone.timedelta(minutes=15)
    battle_duration_cutoff = now - timezone.timedelta(minutes=Battle.DURATION_MINUTES + 5)

    Battle.objects.filter(
        status=Battle.Status.WAITING,
        created_at__lt=stale_waiting_cutoff,
    ).update(status=Battle.Status.CANCELLED)

    # Active battles past their timer
    Battle.objects.filter(
        status=Battle.Status.ACTIVE,
        ends_at__lt=now,
    ).update(status=Battle.Status.COMPLETED)

    # Active battles that started long enough ago that the timer must have elapsed
    # (catches orphaned battles after server restarts)
    Battle.objects.filter(
        status=Battle.Status.ACTIVE,
        started_at__lt=battle_duration_cutoff,
    ).update(status=Battle.Status.COMPLETED)

    # Fallback: active battles with no started_at but created long ago
    Battle.objects.filter(
        status=Battle.Status.ACTIVE,
        started_at__isnull=True,
        created_at__lt=battle_duration_cutoff,
    ).update(status=Battle.Status.CANCELLED)

    # Prevent spamming: only one pending request per challenger→opponent pair
    existing = BattleRequest.objects.filter(
        challenger=challenger,
        opponent=opponent,
        status=BattleRequest.Status.PENDING,
    ).exists()
    if existing:
        raise ValueError("You already have a pending request to this user.")

    # Check the CHALLENGER is not already in an active battle
    challenger_busy = Battle.objects.filter(
        status__in=[Battle.Status.WAITING, Battle.Status.ACTIVE],
    ).filter(Q(challenger=challenger) | Q(opponent=challenger)).exists()
    if challenger_busy:
        raise ValueError("You are already in an active battle.")

    # Also check the opponent doesn't already have an active battle
    active = Battle.objects.filter(
        status__in=[Battle.Status.WAITING, Battle.Status.ACTIVE],
    ).filter(challenger=opponent)
    active2 = Battle.objects.filter(
        status__in=[Battle.Status.WAITING, Battle.Status.ACTIVE],
        opponent=opponent,
    )
    if active.exists() or active2.exists():
        raise ValueError("That user is already in an active battle.")

    req = BattleRequest.objects.create(
        challenger=challenger,
        opponent=opponent,
        difficulty=difficulty,
        status=BattleRequest.Status.PENDING,
        expires_at=timezone.now() + timezone.timedelta(minutes=5),
    )

    # Notify opponent via their personal WS notification channel
    _push_to_user(
        user_id=str(opponent.id),
        event_type="battle_request",
        payload={
            "request_id": str(req.id),
            "challenger": challenger.username,
            "difficulty": difficulty,
            "expires_at": req.expires_at.isoformat(),
        },
    )

    logger.info(
        "BattleRequest created: %s -> %s [%s]",
        challenger.username, opponent.username, difficulty,
    )
    return req


def respond_to_battle_request(
    battle_request: BattleRequest,
    accepted: bool,
) -> Battle | None:
    """
    Accept or reject a pending battle request.
    On accept → creates the Battle, assigns problems, notifies both players.
    Returns the new Battle instance (or None on reject).
    """
    if battle_request.is_expired():
        battle_request.status = BattleRequest.Status.EXPIRED
        battle_request.save(update_fields=["status"])
        raise ValueError("Battle request has expired.")

    if not accepted:
        battle_request.status = BattleRequest.Status.REJECTED
        battle_request.save(update_fields=["status"])

        # Tell the challenger their request was rejected
        _push_to_user(
            user_id=str(battle_request.challenger_id),
            event_type="battle_rejected",
            payload={
                "request_id": str(battle_request.id),
                "opponent": battle_request.opponent.username,
            },
        )
        return None

    # ── Accepted ─────────────────────────────────────────────────────────
    with transaction.atomic():
        battle_request.status = BattleRequest.Status.ACCEPTED
        battle_request.save(update_fields=["status"])

        battle = _create_battle(battle_request)

    # Notify both players (outside transaction so WS doesn't block)
    battle_info = {
        "battle_id": str(battle.id),
        "challenger": battle.challenger.username,
        "opponent":   battle.opponent.username,
        "difficulty": battle.difficulty,
        "problems": [
            {"id": str(p.id), "title": p.title, "slug": p.slug}
            for p in battle.problems.all()
        ],
    }
    _push_to_user(str(battle.challenger_id), "battle_started", battle_info)
    _push_to_user(str(battle.opponent_id),   "battle_started", battle_info)

    logger.info("Battle %s started: %s vs %s", battle.id, battle.challenger, battle.opponent)
    return battle


def _create_battle(battle_request: BattleRequest) -> Battle:
    """Create the Battle model and both BattleParticipant rows."""
    battle = Battle.objects.create(
        battle_request=battle_request,
        challenger=battle_request.challenger,
        opponent=battle_request.opponent,
        difficulty=battle_request.difficulty,
        status=Battle.Status.WAITING,
    )

    # Assign 5 random published problems at the chosen difficulty
    problems = list(
        Problem.objects
        .filter(difficulty=battle_request.difficulty, is_published=True)
        .order_by("?")[:5]
    )
    if len(problems) < 5:
        # Fall back to all difficulties if not enough at the chosen one
        already_ids = [p.id for p in problems]
        extra = list(
            Problem.objects
            .exclude(id__in=already_ids)
            .filter(is_published=True)
            .order_by("?")[: 5 - len(problems)]
        )
        problems += extra

    battle.problems.set(problems)

    # Create per-user score rows
    BattleParticipant.objects.bulk_create([
        BattleParticipant(battle=battle, user=battle_request.challenger),
        BattleParticipant(battle=battle, user=battle_request.opponent),
    ])

    return battle


# ─────────────────────────────────────────────────────────────────────────────
# Scoring a submission inside a battle
# ─────────────────────────────────────────────────────────────────────────────

def score_battle_submission(
    battle: Battle,
    user: User,
    problem_id: str,
    judge_status: str,      # "accepted" | "wrong_answer" | etc.
    execution_time_ms: int | None,
    memory_used_kb: int | None,
    language: str,
    code: str,
    error_output: str = "",
) -> BattleSubmission:
    """
    Record a submission result and award points if accepted.
    Broadcasts the updated scoreboard to the battle WS group.
    """
    # Map judge status string → BattleSubmission.Status enum
    STATUS_MAP = {
        "accepted":      BattleSubmission.Status.ACCEPTED,
        "wrong_answer":  BattleSubmission.Status.WRONG_ANSWER,
        "time_limit":    BattleSubmission.Status.TIME_LIMIT,
        "runtime_error": BattleSubmission.Status.RUNTIME_ERROR,
        "compile_error": BattleSubmission.Status.COMPILE_ERROR,
    }
    sub_status = STATUS_MAP.get(judge_status, BattleSubmission.Status.WRONG_ANSWER)

    points = 0
    if sub_status == BattleSubmission.Status.ACCEPTED:
        # Award flat 10 pts — but only once per user per problem
        already_solved = has_user_solved_problem(battle, user, problem_id)
        if not already_solved:
            points = PROBLEM_POINTS

    with transaction.atomic():
        sub = BattleSubmission.objects.create(
            battle=battle,
            user=user,
            problem_id=problem_id,
            code=code,
            language=language,
            status=sub_status,
            points_earned=points,
            error_output=error_output,
            execution_time_ms=execution_time_ms,
            memory_used_kb=memory_used_kb,
        )

        if points > 0:
            # Update participant row
            BattleParticipant.objects.filter(battle=battle, user=user).update(
                score=F("score") + points,
                problems_solved=F("problems_solved") + (1 if sub_status == BattleSubmission.Status.ACCEPTED else 0),
            )

    # Broadcast fresh scoreboard to everyone in the battle room
    _broadcast_scoreboard(battle)

    # Auto-end the battle if every problem has been accepted by at least one player
    if sub_status == BattleSubmission.Status.ACCEPTED:
        _check_and_auto_end(battle)

    return sub


# ─────────────────────────────────────────────────────────────────────────────
# Ending / closing a battle
# ─────────────────────────────────────────────────────────────────────────────

def end_battle(battle: Battle) -> Battle:
    """
    Close a battle, determine the winner, update global ratings and user stats.
    Called by the timer task or when all problems are solved.
    """
    if battle.status == Battle.Status.COMPLETED:
        return battle  # idempotent

    with transaction.atomic():
        participants = list(
            BattleParticipant.objects.select_related("user")
            .filter(battle=battle)
            .order_by("-score", "-problems_solved")
        )

        winner = None
        if participants:
            top    = participants[0]
            second = participants[1] if len(participants) > 1 else None
            # Declare winner only if scores differ (tie = no winner)
            if not second or top.score > second.score:
                winner = top.user

        # Update battle record
        battle.status   = Battle.Status.COMPLETED
        battle.winner   = winner
        battle.ended_at = timezone.now()
        battle.save(update_fields=["status", "winner", "ended_at"])

        # ─── Update user stat counters ──────────────────
        participant_user_ids = [p.user_id for p in participants]
        # +1 battles_played for everyone
        User.objects.filter(id__in=participant_user_ids).update(
            battles_played=F("battles_played") + 1,
        )
        if winner:
            # +1 battles_won  +BATTLE_WIN_POINTS rating for the winner
            User.objects.filter(id=winner.id).update(
                battles_won=F("battles_won") + 1,
                rating=F("rating") + BATTLE_WIN_POINTS,
            )
        # ────────────────────────────────────────────────

    # Build enriched result payload
    result_payload = {
        "battle_id": str(battle.id),
        "winner":    winner.username if winner else None,
        "is_draw":   winner is None,
        "scores": [
            {
                "username":        p.user.username,
                "score":           p.score,
                "problems_solved": p.problems_solved,
                "result":          (
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

    logger.info("Battle %s ended. Winner: %s", battle.id, winner)
    return battle


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _check_and_auto_end(battle: Battle):
    """
    End the battle if every problem has been accepted by at least one participant.
    Called after every accepted submission.
    """
    total_problems = battle.problems.count()
    if total_problems == 0:
        return

    # Count distinct problems with at least one accepted submission
    solved_count = (
        BattleSubmission.objects
        .filter(battle=battle, status=BattleSubmission.Status.ACCEPTED)
        .values("problem_id")
        .distinct()
        .count()
    )
    if solved_count >= total_problems:
        logger.info("All %d problems solved — auto-ending battle %s", total_problems, battle.id)
        # Re-fetch with participants before ending
        from .selectors import get_battle_by_id
        fresh = get_battle_by_id(str(battle.id))
        if fresh and fresh.status == Battle.Status.ACTIVE:
            end_battle(fresh)


def _push_to_user(user_id: str, event_type: str, payload: dict):
    """Send a message to a user's personal notification WS group."""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{user_id}",
        {
            "type": "notify",          # must match consumer method
            "event_type": event_type,
            "payload": payload,
        },
    )


def _broadcast_scoreboard(battle: Battle):
    """Push the live scoreboard to everyone in the battle WS room."""
    participants = BattleParticipant.objects.filter(battle=battle).select_related("user")
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"battle_{battle.id}",
        {
            "type": "scoreboard_update",
            "payload": {
                "scores": [
                    {
                        "username":        p.user.username,
                        "score":           p.score,
                        "problems_solved": p.problems_solved,
                    }
                    for p in participants
                ],
                "seconds_remaining": battle.seconds_remaining(),
            },
        },
    )
