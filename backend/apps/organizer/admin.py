from django.contrib import admin

from .models import OrganizerProfile


@admin.register(OrganizerProfile)
class OrganizerProfileAdmin(admin.ModelAdmin):
    list_display = ["org_name", "org_type", "user", "is_verified", "created_at"]
    list_filter = ["org_type", "is_verified"]
    search_fields = ["org_name", "user__username", "user__email"]
    readonly_fields = ["created_at", "updated_at"]
    actions = ["verify_organizations"]

    @admin.action(description="Mark selected organizations as verified")
    def verify_organizations(self, request, queryset):
        queryset.update(is_verified=True)
