from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.models import Tip
from backend.app.schemas import TipsResponse, TipItem
from backend.app.auth import get_current_user_optional, AuthUser
from backend.app.config import settings

router = APIRouter(tags=["Tips"])

@router.get("/tips", response_model=TipsResponse)
async def get_tips(
    tier: str = Query("free", description="Subscription tier: 'free' or 'premium'"),
    user: Optional[AuthUser] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns AI Poisson/Empirical prediction tips for the specified tier.
    Published tips are strictly immutable.
    Free tips are public; Premium tips require VIP user entitlement (or Admin access).
    """
    if tier not in ("free", "premium"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid tier parameter. Allowed values: 'free' or 'premium'."}
        )

    # Phase 3 Entitlement Check: Premium tier requires VIP or Admin
    if tier == "premium":
        if not user or not user.is_vip:
            return TipsResponse(
                source=settings.ENGINE_SOURCE,
                tips=[],
                upgrade_required=True,
                message="VIP subscription required to access premium tips"
            )

    stmt = select(Tip).where(Tip.tier == tier).order_by(Tip.published_at.desc(), Tip.kickoff.asc())
    res = await db.execute(stmt)
    records = res.scalars().all()

    tip_items = [
        TipItem(
            id=t.id,
            fixture_id=t.fixture_id,
            league=t.league,
            home=t.home,
            away=t.away,
            kickoff=t.kickoff,
            market=t.market,
            selection=t.selection,
            confidence=t.confidence,
            risk=t.risk,
            explanation=t.explanation,
            published_at=t.published_at,
            model_version=t.model_version,
            home_logo_url=t.home_logo_url,
            away_logo_url=t.away_logo_url
        )
        for t in records
    ]

    return TipsResponse(
        source=settings.ENGINE_SOURCE,
        tips=tip_items,
        upgrade_required=False if tier == "premium" else None
    )
