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
# 2. Fixtures
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

class FixturesResponse(ContractModel):
    source: str
    fixtures: List[FixtureItem]

# ------------------------------------------------------------------------------
# 3. Tips
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

class TipsResponse(ContractModel):
    source: str
    tips: List[TipItem]

# ------------------------------------------------------------------------------
# 4. Results / Settlement
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

# ------------------------------------------------------------------------------
# Errors
# ------------------------------------------------------------------------------
class ErrorResponse(ContractModel):
    error: str
