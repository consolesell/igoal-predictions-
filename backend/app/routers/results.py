from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.models import SettlementResult
from backend.app.schemas import ResultsResponse, SettlementItem
from backend.app.config import settings

router = APIRouter(tags=["Results"])

@router.get("/results", response_model=ResultsResponse)
async def get_results(
    since: int = Query(0, ge=0, description="Fetch results settled at or after this epoch timestamp in SECONDS"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns settlement outcomes for predictions settled since the given Unix epoch second.
    Used by TipSync.java on Android to update local prediction badges.
    """
    stmt = (
        select(SettlementResult)
        .where(SettlementResult.settled_at >= since)
        .order_by(SettlementResult.settled_at.asc())
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    items = [
        SettlementItem(
            prediction_id=r.prediction_id,
            status=r.status,
            home_goals=r.home_goals,
            away_goals=r.away_goals,
            settled_at=r.settled_at
        )
        for r in records
    ]

    return ResultsResponse(
        source=settings.SETTLER_SOURCE,
        results=items
    )
