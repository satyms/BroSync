"""
Organizer - Models
===================
OrganizerProfile stores extra metadata for users with the 'organizer' role.
"""

import uuid

from django.db import models


class OrganizerProfile(models.Model):
    """
    Extended profile for organizer users (colleges, universities, companies).
    Created when a user upgrades their role to 'organizer'.
    """

    class OrgType(models.TextChoices):
        COLLEGE = "college", "College"
        UNIVERSITY = "university", "University"
        COMPANY = "company", "Company"
        COMMUNITY = "community", "Community"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="organizer_profile",
    )
    org_name = models.CharField(max_length=200, help_text="Name of the organization.")
    org_type = models.CharField(
        max_length=20, choices=OrgType.choices, default=OrgType.COLLEGE,
    )
    description = models.TextField(blank=True, default="")
    website = models.URLField(blank=True, default="")
    logo_url = models.URLField(max_length=500, blank=True, default="")
    location = models.CharField(max_length=200, blank=True, default="")
    is_verified = models.BooleanField(
        default=False, help_text="Whether the organization has been verified by site admins.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organizer_profile"
        verbose_name = "Organizer Profile"
        verbose_name_plural = "Organizer Profiles"

    def __str__(self):
        return f"{self.org_name} ({self.user.username})"
