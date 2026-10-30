import re
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.models import Fixture
from backend.app.schemas import FixturesResponse, FixtureItem
from backend.app.config import settings
from backend.app.services.football_api import VALID_STATUSES

router = APIRouter(tags=["Fixtures"])

DATE_REGEX = re.compile(r"^\d{4}-\d{2}-\d{2}$")

@router.get("/fixtures", response_model=FixturesResponse)
async def get_fixtures(
    date: str = Query(..., description="Target date in YYYY-MM-DD UTC"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns fixtures scheduled on a given UTC calendar day.
    Adheres strictly to docs/API_CONTRACT.md and Android BackendClient.java model.
    """
    if not DATE_REGEX.match(date):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid date format. Expected yyyy-MM-dd (e.g. 2026-10-30)."}
        )

    try:
        # Convert date to start & end of day UTC epoch seconds
        start_dt = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        start_epoch = int(start_dt.timestamp())
        end_epoch = start_epoch + 86400  # 24 hours in seconds
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Invalid calendar date."}
        )

    # Query fixtures in that epoch window
    stmt = (
        select(Fixture)
        .where(
            Fixture.kickoff >= start_epoch,
            Fixture.kickoff < end_epoch,
            Fixture.status.in_(VALID_STATUSES)
        )
        .order_by(Fixture.kickoff.asc())
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    fixture_items = []
    for r in records:
        # Guarantee explicit nulls for home_goals, away_goals, and minute when not available
        h_goals = r.home_goals if r.status in ("LIVE", "FINISHED") else None
        a_goals = r.away_goals if r.status in ("LIVE", "FINISHED") else None
        min_val = r.minute if r.status == "LIVE" else None

        fixture_items.append(
            FixtureItem(
                id=r.id,
                league=r.league,
                country=r.country,
                home=r.home,
                away=r.away,
                kickoff=r.kickoff,
                status=r.status,
                home_goals=h_goals,
                away_goals=a_goals,
                minute=min_val
            )
        )

    return FixturesResponse(
        source=settings.FOOTBALL_DATA_SOURCE,
        fixtures=fixture_items
    )
