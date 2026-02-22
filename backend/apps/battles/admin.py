"""Battles - Django Admin."""

from django.contrib import admin
from .models import Battle, BattleParticipant, BattleRequest, BattleSubmission


@admin.register(BattleRequest)
class BattleRequestAdmin(admin.ModelAdmin):
    list_display  = ["challenger", "opponent", "difficulty", "status", "created_at"]
    list_filter   = ["status", "difficulty"]
    search_fields = ["challenger__username", "opponent__username"]
    readonly_fields = ["id", "created_at", "updated_at"]


class ParticipantInline(admin.TabularInline):
    model = BattleParticipant
    extra = 0
    readonly_fields = ["user", "score", "problems_solved", "is_connected"]


@admin.register(Battle)
class BattleAdmin(admin.ModelAdmin):
    list_display  = ["id", "challenger", "opponent", "difficulty", "status", "winner", "created_at"]
    list_filter   = ["status", "difficulty"]
    search_fields = ["challenger__username", "opponent__username"]
    readonly_fields = ["id", "created_at", "updated_at", "started_at", "ended_at"]
    inlines = [ParticipantInline]


@admin.register(BattleSubmission)
class BattleSubmissionAdmin(admin.ModelAdmin):
    list_display  = ["user", "problem", "battle", "status", "points_earned", "submitted_at"]
    list_filter   = ["status", "language"]
    search_fields = ["user__username", "problem__title"]
    readonly_fields = ["id", "submitted_at"]
