import time
import logging
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models import Fixture, Tip, SettlementResult
from backend.app.config import settings

logger = logging.getLogger(__name__)

class SettlementWorker:
    def __init__(self):
        self.source = settings.SETTLER_SOURCE

    def evaluate_settlement(self, market: str, selection: str, fixture_status: str, home_goals: Optional[int], away_goals: Optional[int]) -> str:
        """
        Determines the settlement status: WON, LOST, VOID, or POSTPONED.
        """
        if fixture_status == "POSTPONED":
            return "POSTPONED"

        if fixture_status != "FINISHED" or home_goals is None or away_goals is None:
            return "VOID"

        m_clean = market.strip().lower()
        s_clean = selection.strip().lower()

        # 1. Match Winner (1X2)
        if "1x2" in m_clean or "match winner" in m_clean:
            if "home" in s_clean or s_clean == "1":
                return "WON" if home_goals > away_goals else "LOST"
            elif "away" in s_clean or s_clean == "2":
                return "WON" if away_goals > home_goals else "LOST"
            elif "draw" in s_clean or s_clean == "x":
                return "WON" if home_goals == away_goals else "LOST"

        # 2. Over/Under Goals (e.g. 2.5)
        if "over/under" in m_clean or "goals" in m_clean:
            total_goals = home_goals + away_goals
            if "over 2.5" in s_clean:
                return "WON" if total_goals > 2 else "LOST"
            elif "under 2.5" in s_clean:
                return "WON" if total_goals <= 2 else "LOST"
            elif "over 1.5" in s_clean:
                return "WON" if total_goals > 1 else "LOST"
            elif "under 1.5" in s_clean:
                return "WON" if total_goals <= 1 else "LOST"

        # 3. Both Teams to Score (BTTS)
        if "both teams to score" in m_clean or "btts" in m_clean:
            both_scored = (home_goals > 0 and away_goals > 0)
            if s_clean in ("yes", "btts yes"):
                return "WON" if both_scored else "LOST"
            elif s_clean in ("no", "btts no"):
                return "WON" if not both_scored else "LOST"

        # Default fallback
        return "VOID"

    async def run_worker(self, db: AsyncSession) -> int:
        """
        Scans for unsettled tips linked to completed or postponed fixtures,
        computes outcome, and commits SettlementResult records.
        """
        # Fetch tips that do NOT have a settlement result yet
        stmt = (
            select(Tip)
            .join(Fixture, Tip.fixture_id == Fixture.id)
            .outerjoin(SettlementResult, Tip.id == SettlementResult.prediction_id)
            .where(
                SettlementResult.prediction_id == None,
                Fixture.status.in_(["FINISHED", "POSTPONED"])
            )
            .options(selectinload(Tip.fixture))
        )
        result = await db.execute(stmt)
        unsettled_tips = result.scalars().all()

        settled_count = 0
        now_epoch = int(time.time())

        for tip in unsettled_tips:
            fx = tip.fixture
            if not fx:
                continue

            h_goals = fx.home_goals if fx.home_goals is not None else 0
            a_goals = fx.away_goals if fx.away_goals is not None else 0

            status = self.evaluate_settlement(
                market=tip.market,
                selection=tip.selection,
                fixture_status=fx.status,
                home_goals=h_goals if fx.status == "FINISHED" else 0,
                away_goals=a_goals if fx.status == "FINISHED" else 0
            )

            settlement = SettlementResult(
                prediction_id=tip.id,
                status=status,
                home_goals=h_goals,
                away_goals=a_goals,
                settled_at=now_epoch
            )
            db.add(settlement)
            settled_count += 1

        if settled_count > 0:
            await db.commit()
            logger.info(f"Settlement worker processed {settled_count} results")

        return settled_count

settlement_worker = SettlementWorker()
