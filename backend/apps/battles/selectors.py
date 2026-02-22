"""
Battles - Selectors
====================
Pure DB read functions — keep views and services thin.
All queries go here so they're easy to test and reuse.
"""

from django.db.models import QuerySet
from apps.accounts.models import User
from .models import Battle, BattleRequest, BattleSubmission


# ─── Battle Requests ───────────────────────────────────────────────────────

def get_pending_received_requests(user: User) -> QuerySet:
    """All PENDING battle requests targeting this user."""
    return (
        BattleRequest.objects
        .filter(opponent=user, status=BattleRequest.Status.PENDING)
        .select_related("challenger", "opponent")
        .order_by("-created_at")
    )


def get_pending_sent_requests(user: User) -> QuerySet:
    """All PENDING battle requests sent by this user."""
    return (
        BattleRequest.objects
        .filter(challenger=user, status=BattleRequest.Status.PENDING)
        .select_related("challenger", "opponent")
        .order_by("-created_at")
    )


def get_battle_request_for_opponent(request_id: str, opponent: User) -> BattleRequest | None:
    """Return a specific PENDING request if it belongs to this opponent."""
    try:
        return BattleRequest.objects.select_related(
            "challenger", "opponent"
        ).get(id=request_id, opponent=opponent, status=BattleRequest.Status.PENDING)
    except BattleRequest.DoesNotExist:
        return None


# ─── Battles ───────────────────────────────────────────────────────────────

def get_battle_by_id(battle_id: str) -> Battle | None:
    """Return a battle with all related data preloaded, or None."""
    try:
        return (
            Battle.objects
            .select_related("challenger", "opponent", "winner", "battle_request")
            .prefetch_related("problems", "participants__user")
            .get(id=battle_id)
        )
    except Battle.DoesNotExist:
        return None


def get_user_battles(user: User) -> QuerySet:
    """All battles (any status) that involve this user."""
    return (
        Battle.objects
        .filter(challenger=user)
        .union(Battle.objects.filter(opponent=user))
        .order_by("-created_at")
    )


def get_user_active_battle(user: User) -> Battle | None:
    """Return the current ACTIVE or WAITING battle for this user, if any."""
    return (
        Battle.objects
        .filter(
            status__in=[Battle.Status.WAITING, Battle.Status.ACTIVE],
        )
        .filter(challenger=user)
        .union(
            Battle.objects.filter(
                status__in=[Battle.Status.WAITING, Battle.Status.ACTIVE],
                opponent=user,
            )
        )
        .first()
    )


# ─── Battle Submissions ────────────────────────────────────────────────────

def count_accepted_for_problem(battle: Battle, problem_id) -> int:
    """How many ACCEPTED submissions exist for this problem in this battle."""
    return BattleSubmission.objects.filter(
        battle=battle,
        problem_id=problem_id,
        status=BattleSubmission.Status.ACCEPTED,
    ).count()


def has_user_solved_problem(battle: Battle, user: User, problem_id) -> bool:
    """Did this user already get an ACCEPTED submission for this problem?"""
    return BattleSubmission.objects.filter(
        battle=battle,
        user=user,
        problem_id=problem_id,
        status=BattleSubmission.Status.ACCEPTED,
    ).exists()


# ─── Battle History ───────────────────────────────────────────────────────

from django.db.models import Q as _Q

def get_user_battle_history(user: User) -> list:
    """
    Return a list of completed/cancelled battles for a user, richly annotated:
      opponent        : username of the other player
      result          : 'win' | 'loss' | 'draw'
      my_score        : points earned by the user
      opponent_score  : points earned by the other player
      my_solved       : problems the user solved
      opponent_solved : problems the opponent solved
      difficulty      : battle difficulty
      ended_at        : when the battle finished
      battle_id       : UUID
    """
    from .models import BattleParticipant

    battles = (
        Battle.objects
        .filter(
            _Q(challenger=user) | _Q(opponent=user),
            status__in=[Battle.Status.COMPLETED, Battle.Status.CANCELLED],
        )
        .select_related("challenger", "opponent", "winner")
        .prefetch_related("participants__user")
        .order_by("-ended_at", "-created_at")
    )

    history = []
    for battle in battles:
        opponent = battle.opponent if battle.challenger_id == user.id else battle.challenger
        participants = {p.user_id: p for p in battle.participants.all()}

        my_part       = participants.get(user.id)
        opp_part      = participants.get(opponent.id)

        my_score       = my_part.score          if my_part  else 0
        opp_score      = opp_part.score         if opp_part else 0
        my_solved      = my_part.problems_solved if my_part  else 0
        opp_solved     = opp_part.problems_solved if opp_part else 0

        if battle.winner_id is None:
            result = "draw"
        elif battle.winner_id == user.id:
            result = "win"
        else:
            result = "loss"

        history.append({
            "battle_id":       str(battle.id),
            "opponent":        opponent.username,
            "result":          result,
            "my_score":        my_score,
            "opponent_score":  opp_score,
            "my_solved":       my_solved,
            "opponent_solved": opp_solved,
            "difficulty":      battle.difficulty,
            "ended_at":        battle.ended_at.isoformat() if battle.ended_at else None,
            "status":          battle.status,
        })

    return history
