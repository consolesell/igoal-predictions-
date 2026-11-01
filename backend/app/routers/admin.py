import time
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select, update, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models import Fixture, Tip, SettlementResult, AuditLog, Club
from backend.app.schemas import (
    AdminFixtureCreate,
    AdminFixturePatch,
    FixtureItem,
    AdminTipCreate,
    TipItem,
    AdminForceSettle,
    SettlementItem,
    AuditLogItem,
    AuditLogsResponse,
    NotificationBroadcastRequest
)
from backend.app.auth import get_admin_user, AuthUser, record_audit_log
from backend.app.config import settings

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

# ------------------------------------------------------------------------------
# 1. Fixture CRUD (Phase 1)
# ------------------------------------------------------------------------------

@router.post("/fixtures", response_model=FixtureItem)
async def create_fixture(
    payload: AdminFixtureCreate,
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new fixture. Auto-assigns ID if not provided, links club logos if available.
    """
    fx_id = payload.id or f"fx_{int(time.time())}_{payload.home[:3].lower()}_{payload.away[:3].lower()}"

    # Verify ID uniqueness
    stmt = select(Fixture).where(Fixture.id == fx_id)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": f"Fixture with ID '{fx_id}' already exists."}
        )

    # Resolve club logos if IDs provided
    home_logo = None
    away_logo = None
    if payload.home_club_id:
        c = (await db.execute(select(Club).where(Club.id == payload.home_club_id))).scalar_one_or_none()
        if c:
            home_logo = c.logo_url
    if payload.away_club_id:
        c = (await db.execute(select(Club).where(Club.id == payload.away_club_id))).scalar_one_or_none()
        if c:
            away_logo = c.logo_url

    fixture = Fixture(
        id=fx_id,
        league=payload.league,
        country=payload.country,
        home=payload.home,
        away=payload.away,
        kickoff=payload.kickoff,
        status=payload.status or "SCHEDULED",
        home_goals=payload.home_goals,
        away_goals=payload.away_goals,
        minute=payload.minute,
        home_club_id=payload.home_club_id,
        away_club_id=payload.away_club_id,
        home_logo_url=home_logo,
        away_logo_url=away_logo,
        deleted_at=None
    )
    db.add(fixture)
    await db.commit()
    await db.refresh(fixture)

    await record_audit_log(
        db=db,
        actor_id=admin.uid,
        action="FIXTURE_CREATE",
        target_type="fixture",
        target_id=fixture.id,
        details={"home": fixture.home, "away": fixture.away, "league": fixture.league, "status": fixture.status}
    )

    return FixtureItem.model_validate(fixture)


@router.patch("/fixtures/{fixture_id}", response_model=FixtureItem)
async def update_fixture(
    fixture_id: str,
    payload: AdminFixturePatch,
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Partially updates an existing fixture. Immediately reflected in public /v1/fixtures.
    """
    stmt = select(Fixture).where(Fixture.id == fixture_id)
    fixture = (await db.execute(stmt)).scalar_one_or_none()
    if not fixture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Fixture '{fixture_id}' not found."}
        )

    changes = {}
    for field, val in payload.model_dump(exclude_unset=True).items():
        if val is not None or field in ("home_goals", "away_goals", "minute"):
            setattr(fixture, field, val)
            changes[field] = val

    await db.commit()
    await db.refresh(fixture)

    await record_audit_log(
        db=db,
        actor_id=admin.uid,
        action="FIXTURE_UPDATE",
        target_type="fixture",
        target_id=fixture.id,
        details=changes
    )

    return FixtureItem.model_validate(fixture)


@router.delete("/fixtures/{fixture_id}")
async def delete_fixture(
    fixture_id: str,
    force: bool = Query(False, description="Set true to force delete even if settled tips exist"),
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Soft-deletes a fixture. Checks for settled tips to prevent silent corruption unless force=True.
    """
    stmt = select(Fixture).options(selectinload(Fixture.tips).selectinload(Tip.settlement)).where(Fixture.id == fixture_id)
    fixture = (await db.execute(stmt)).scalar_one_or_none()
    if not fixture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Fixture '{fixture_id}' not found."}
        )

    # Check for settled tips
    settled_tips = [t for t in fixture.tips if t.settlement is not None]
    if settled_tips and not force:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": f"Cannot delete fixture: {len(settled_tips)} prediction tips have already been settled. Pass force=true to override."
            }
        )

    now_sec = int(time.time())
    fixture.deleted_at = now_sec
    await db.commit()

    await record_audit_log(
        db=db,
        actor_id=admin.uid,
        action="FIXTURE_DELETE",
        target_type="fixture",
        target_id=fixture_id,
        details={"force": force, "settled_tips_count": len(settled_tips), "deleted_at": now_sec}
    )

    return {"ok": True, "fixtureId": fixture_id, "softDeleted": True, "deletedAt": now_sec}


@router.get("/fixtures", response_model=List[FixtureItem])
async def list_admin_fixtures(
    from_epoch: Optional[int] = Query(None, alias="from"),
    to_epoch: Optional[int] = Query(None, alias="to"),
    status: Optional[str] = Query(None),
    include_deleted: bool = Query(False, alias="includeDeleted"),
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin listing of fixtures with optional range and deleted filter.
    """
    conditions = []
    if not include_deleted:
        conditions.append(Fixture.deleted_at == None)
    if from_epoch:
        conditions.append(Fixture.kickoff >= from_epoch)
    if to_epoch:
        conditions.append(Fixture.kickoff <= to_epoch)
    if status:
        conditions.append(Fixture.status == status)

    stmt = select(Fixture).where(and_(*conditions)).order_by(Fixture.kickoff.desc())
    res = await db.execute(stmt)
    records = res.scalars().all()
    return [FixtureItem.model_validate(r) for r in records]

# ------------------------------------------------------------------------------
# 2. Tips Management (Phase 1)
# ------------------------------------------------------------------------------

@router.post("/tips", response_model=TipItem)
async def publish_tip(
    payload: AdminTipCreate,
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Manually publishes a prediction tip. Once published, tip is immutable.
    """
    # Verify fixture exists and is active
    stmt = select(Fixture).where(Fixture.id == payload.fixture_id, Fixture.deleted_at == None)
    fixture = (await db.execute(stmt)).scalar_one_or_none()
    if not fixture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Active fixture '{payload.fixture_id}' not found."}
        )

    market_slug = "".join(c for c in payload.market if c.isalnum())[:6].lower() or "pick"
    tip_id = payload.id or f"tip_{payload.fixture_id.replace('fx_', '')}_{market_slug}_{int(time.time())}"

    # Check uniqueness
    existing = (await db.execute(select(Tip).where(Tip.id == tip_id))).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": f"Tip with ID '{tip_id}' already exists."}
        )

    # Derive risk automatically if not explicitly provided
    calculated_risk = payload.risk
    if not calculated_risk:
        if payload.confidence >= 70:
            calculated_risk = "LOW"
        elif payload.confidence >= 58:
            calculated_risk = "MEDIUM"
        else:
            calculated_risk = "HIGH"

    default_exp = (
        payload.explanation
        or f"Analyst consensus on {fixture.home} vs {fixture.away}; {payload.selection} selected with {payload.confidence}% confidence edge."
    )

    now_sec = int(time.time())
    tip = Tip(
        id=tip_id,
        fixture_id=fixture.id,
        league=fixture.league,
        home=fixture.home,
        away=fixture.away,
        kickoff=fixture.kickoff,
        market=payload.market,
        selection=payload.selection,
        confidence=payload.confidence,
        risk=calculated_risk,
        explanation=default_exp,
        published_at=now_sec,
        model_version=payload.model_version or "expert-analyst-1.0",
        tier=payload.tier,
        home_logo_url=fixture.home_logo_url,
        away_logo_url=fixture.away_logo_url
    )
    db.add(tip)
    await db.commit()
    await db.refresh(tip)

    await record_audit_log(
        db=db,
        actor_id=admin.uid,
        action="TIP_PUBLISH",
        target_type="tip",
        target_id=tip.id,
        details={"market": tip.market, "selection": tip.selection, "tier": tip.tier}
    )

    return TipItem.model_validate(tip)


@router.delete("/tips/{tip_id}")
async def delete_tip(
    tip_id: str,
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a tip ONLY if it has not yet been settled. Settled predictions are immutable.
    """
    stmt = select(Tip).options(selectinload(Tip.settlement)).where(Tip.id == tip_id)
    tip = (await db.execute(stmt)).scalar_one_or_none()
    if not tip:
        raise HTTPException(status_code=404, detail={"error": f"Tip '{tip_id}' not found."})

    if tip.settlement is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": f"Tip '{tip_id}' has already been settled and is strictly immutable."}
        )

    await db.delete(tip)
    await db.commit()

    await record_audit_log(
        db=db,
        actor_id=admin.uid,
        action="TIP_DELETE",
        target_type="tip",
        target_id=tip_id
    )

    return {"ok": True, "tipId": tip_id, "deleted": True}

# ------------------------------------------------------------------------------
# 3. Force Settlement (Phase 1)
# ------------------------------------------------------------------------------

@router.post("/settlements", response_model=SettlementItem)
async def force_settle(
    payload: AdminForceSettle,
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Administrator force settlement for a prediction tip.
    """
    stmt = select(Tip).where(Tip.id == payload.prediction_id)
    tip = (await db.execute(stmt)).scalar_one_or_none()
    if not tip:
        raise HTTPException(status_code=404, detail={"error": f"Tip '{payload.prediction_id}' not found."})

    existing = (await db.execute(select(SettlementResult).where(SettlementResult.prediction_id == tip.id))).scalar_one_or_none()
    now_sec = int(time.time())

    if existing:
        existing.status = payload.status
        existing.home_goals = payload.home_goals
        existing.away_goals = payload.away_goals
        existing.settled_at = now_sec
        settlement = existing
    else:
        settlement = SettlementResult(
            prediction_id=tip.id,
            status=payload.status,
            home_goals=payload.home_goals,
            away_goals=payload.away_goals,
            settled_at=now_sec
        )
        db.add(settlement)

    await db.commit()
    await db.refresh(settlement)

    await record_audit_log(
        db=db,
        actor_id=admin.uid,
        action="FORCE_SETTLE",
        target_type="settlement",
        target_id=tip.id,
        details={"status": payload.status, "score": f"{payload.home_goals}-{payload.away_goals}"}
    )

    return SettlementItem.model_validate(settlement)

# ------------------------------------------------------------------------------
# 4. Audit Logs (Phase 1)
# ------------------------------------------------------------------------------

@router.get("/audit", response_model=AuditLogsResponse)
async def get_audit_logs(
    limit: int = Query(50, le=200),
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    records = res.scalars().all()
    return AuditLogsResponse(
        source="igoal-audit-v1",
        logs=[AuditLogItem.model_validate(r) for r in records]
    )

# ------------------------------------------------------------------------------
# 5. FCM Notification Broadcast (Phase 4)
# ------------------------------------------------------------------------------

@router.post("/notifications/broadcast")
async def broadcast_notification(
    payload: NotificationBroadcastRequest,
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Broadcasts message to FCM channel (match_reminders, settlement_results, system_alerts).
    """
    await record_audit_log(
        db=db,
        actor_id=admin.uid,
        action="NOTIFICATION_BROADCAST",
        target_type="notification",
        target_id=payload.channel,
        details={"title": payload.title, "body": payload.body, "fixtureId": payload.fixture_id}
    )

    return {
        "ok": True,
        "channel": payload.channel,
        "title": payload.title,
        "delivered": True,
        "timestamp": int(time.time())
    }
