from typing import List, Optional, Literal
from pydantic import BaseModel, Field, ConfigDict

# Base configuration for camelCase serialization and explicit nulls
class ContractModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True
    )

# ------------------------------------------------------------------------------
# 1. Health
# ------------------------------------------------------------------------------
class HealthResponse(ContractModel):
    ok: bool = True
    version: str = "2.0.0"
    mode: str = "production"

# ------------------------------------------------------------------------------
# 2. Clubs & Logos (Phase 2)
# ------------------------------------------------------------------------------
class ClubItem(ContractModel):
    id: str
    name: str
    short_name: str = Field(..., serialization_alias="shortName")
    country: str
    logo_path: Optional[str] = Field(default=None, serialization_alias="logoPath")
    logo_url: Optional[str] = Field(default=None, serialization_alias="logoUrl")
    updated_at: Optional[int] = Field(default=None, serialization_alias="updatedAt")

class ClubsListResponse(ContractModel):
    source: str = "igoal-clubs-v1"
    clubs: List[ClubItem]

class ClubCreate(ContractModel):
    id: Optional[str] = None
    name: str
    short_name: str = Field(..., alias="shortName")
    country: str
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")

class ClubLogoUploadRequest(ContractModel):
    logo_url: Optional[str] = Field(default=None, alias="logoUrl")
    image_base64: Optional[str] = Field(default=None, alias="imageBase64")

# ------------------------------------------------------------------------------
# 3. Fixtures (Phase 1 & 2)
# ------------------------------------------------------------------------------
FixtureStatus = Literal["SCHEDULED", "LIVE", "FINISHED", "POSTPONED"]

class FixtureItem(ContractModel):
    id: str
    league: str
    country: str
    home: str
    away: str
    kickoff: int  # Unix epoch SECONDS
    status: FixtureStatus
    home_goals: Optional[int] = Field(default=None, serialization_alias="homeGoals")
    away_goals: Optional[int] = Field(default=None, serialization_alias="awayGoals")
    minute: Optional[int] = Field(default=None, serialization_alias="minute")
    # Denormalized Club Info for Android (Phase 2, optional)
    home_club_id: Optional[str] = Field(default=None, serialization_alias="homeClubId")
    away_club_id: Optional[str] = Field(default=None, serialization_alias="awayClubId")
    home_logo_url: Optional[str] = Field(default=None, serialization_alias="homeLogoUrl")
    away_logo_url: Optional[str] = Field(default=None, serialization_alias="awayLogoUrl")

class FixturesResponse(ContractModel):
    source: str
    fixtures: List[FixtureItem]

class AdminFixtureCreate(ContractModel):
    id: Optional[str] = None
    league: str
    country: str
    home: str
    away: str
    kickoff: int  # Unix epoch SECONDS
    status: Optional[FixtureStatus] = "SCHEDULED"
    home_goals: Optional[int] = Field(default=None, alias="homeGoals")
    away_goals: Optional[int] = Field(default=None, alias="awayGoals")
    minute: Optional[int] = None
    home_club_id: Optional[str] = Field(default=None, alias="homeClubId")
    away_club_id: Optional[str] = Field(default=None, alias="awayClubId")

class AdminFixturePatch(ContractModel):
    status: Optional[FixtureStatus] = None
    home_goals: Optional[int] = Field(default=None, alias="homeGoals")
    away_goals: Optional[int] = Field(default=None, alias="awayGoals")
    minute: Optional[int] = None
    kickoff: Optional[int] = None
    home: Optional[str] = None
    away: Optional[str] = None
    league: Optional[str] = None
    country: Optional[str] = None
    home_club_id: Optional[str] = Field(default=None, alias="homeClubId")
    away_club_id: Optional[str] = Field(default=None, alias="awayClubId")
    home_logo_url: Optional[str] = Field(default=None, alias="homeLogoUrl")
    away_logo_url: Optional[str] = Field(default=None, alias="awayLogoUrl")

# ------------------------------------------------------------------------------
# 4. Tips (Phase 1, 2, 3)
# ------------------------------------------------------------------------------
TipRisk = Literal["LOW", "MEDIUM", "HIGH"]
TipTier = Literal["free", "premium"]

class TipItem(ContractModel):
    id: str
    fixture_id: str = Field(..., serialization_alias="fixtureId")
    league: str
    home: str
    away: str
    kickoff: int  # Unix epoch SECONDS
    market: str
    selection: str
    confidence: int = Field(..., ge=0, le=100)
    risk: TipRisk
    explanation: str
    published_at: int = Field(..., serialization_alias="publishedAt")
    model_version: str = Field(..., serialization_alias="modelVersion")
    home_logo_url: Optional[str] = Field(default=None, serialization_alias="homeLogoUrl")
    away_logo_url: Optional[str] = Field(default=None, serialization_alias="awayLogoUrl")

class TipsResponse(ContractModel):
    source: str
    tips: List[TipItem]
    upgrade_required: Optional[bool] = Field(default=None, serialization_alias="upgradeRequired")
    message: Optional[str] = None

class AdminTipCreate(ContractModel):
    id: Optional[str] = None
    fixture_id: str = Field(..., alias="fixtureId")
    market: str
    selection: str
    confidence: int = Field(..., ge=0, le=100)
    risk: TipRisk
    explanation: str
    tier: TipTier = "free"

# ------------------------------------------------------------------------------
# 5. Results / Settlement
# ------------------------------------------------------------------------------
SettlementStatus = Literal["WON", "LOST", "VOID", "POSTPONED"]

class SettlementItem(ContractModel):
    prediction_id: str = Field(..., serialization_alias="predictionId")
    status: SettlementStatus
    home_goals: int = Field(..., serialization_alias="homeGoals")
    away_goals: int = Field(..., serialization_alias="awayGoals")
    settled_at: int = Field(..., serialization_alias="settledAt")

class ResultsResponse(ContractModel):
    source: str
    results: List[SettlementItem]

class AdminForceSettle(ContractModel):
    prediction_id: str = Field(..., alias="predictionId")
    status: SettlementStatus
    home_goals: int = Field(..., alias="homeGoals")
    away_goals: int = Field(..., alias="awayGoals")

# ------------------------------------------------------------------------------
# 6. User Entitlements (Phase 3)
# ------------------------------------------------------------------------------
class MeResponse(ContractModel):
    uid: str
    email: Optional[str] = None
    display_name: Optional[str] = Field(default=None, serialization_alias="displayName")
    role: str
    tier: str  # "free" or "vip"
    expires_at: Optional[int] = Field(default=None, serialization_alias="expiresAt")
    is_vip: bool = Field(..., serialization_alias="isVip")

class GrantVipRequest(ContractModel):
    uid: str
    days: int = 30
    tier: str = "vip"

# ------------------------------------------------------------------------------
# 7. Audit & Notifications (Phase 4)
# ------------------------------------------------------------------------------
class AuditLogItem(ContractModel):
    id: str
    actor_id: str = Field(..., serialization_alias="actorId")
    action: str
    target_type: str = Field(..., serialization_alias="targetType")
    target_id: str = Field(..., serialization_alias="targetId")
    details: Optional[str] = None
    created_at: int = Field(..., serialization_alias="createdAt")

class AuditLogsResponse(ContractModel):
    source: str = "igoal-audit-v1"
    logs: List[AuditLogItem]

class NotificationBroadcastRequest(ContractModel):
    channel: Literal["match_reminders", "settlement_results", "system_alerts"]
    title: str
    body: str
    fixture_id: Optional[str] = Field(default=None, alias="fixtureId")

# ------------------------------------------------------------------------------
# Errors
# ------------------------------------------------------------------------------
class ErrorResponse(ContractModel):
    error: str
