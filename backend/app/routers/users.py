import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import MeResponse, GrantVipRequest
from backend.app.auth import get_current_user, get_admin_user, AuthUser, record_audit_log

router = APIRouter(tags=["Users & Entitlements"])

@router.get("/me", response_model=MeResponse)
async def get_my_profile(user: AuthUser = Depends(get_current_user)):
    """
    Returns authenticated user's tier, role, VIP status, and subscription expiry.
    """
    return MeResponse(
        uid=user.uid,
        email=user.email,
        display_name=user.display_name or "iGoal Member",
        role=user.role,
        tier=user.tier,
        expires_at=user.vip_expires_at,
        is_vip=user.is_vip
    )

@router.post("/admin/users/entitlement", response_model=MeResponse)
async def grant_user_entitlement(
    payload: GrantVipRequest,
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Administrator assigns VIP entitlement or upgrades user tier (e.g. following Google Play billing webhook).
    """
    now_sec = int(time.time())
    expires_sec = now_sec + (payload.days * 86400) if payload.tier == "vip" else None

    stmt = select(User).where(User.uid == payload.uid)
    user = (await db.execute(stmt)).scalar_one_or_none()

    if not user:
        user = User(
            uid=payload.uid,
            email=f"{payload.uid}@example.com",
            display_name=f"User {payload.uid[:6]}",
            role="user",
            tier=payload.tier,
            vip_expires_at=expires_sec,
            created_at=now_sec,
            updated_at=now_sec
        )
        db.add(user)
    else:
        user.tier = payload.tier
        user.vip_expires_at = expires_sec
        user.updated_at = now_sec

    await db.commit()
    await db.refresh(user)

    await record_audit_log(
        db=db,
        actor_id=admin.uid,
        action="VIP_GRANT",
        target_type="user",
        target_id=user.uid,
        details={"tier": user.tier, "days": payload.days, "expires_at": expires_sec}
    )

    is_vip = user.tier == "vip" and (user.vip_expires_at is None or user.vip_expires_at > now_sec)

    return MeResponse(
        uid=user.uid,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        tier=user.tier,
        expires_at=user.vip_expires_at,
        is_vip=is_vip
    )

@router.post("/me/vip/test-grant", response_model=MeResponse)
async def test_grant_vip(
    user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Testing endpoint for developer/QA to quickly simulate a 30-day VIP upgrade.
    """
    now_sec = int(time.time())
    expires_sec = now_sec + (30 * 86400)

    stmt = select(User).where(User.uid == user.uid)
    db_user = (await db.execute(stmt)).scalar_one_or_none()

    if not db_user:
        db_user = User(
            uid=user.uid,
            email=user.email,
            display_name=user.display_name or "Test User",
            role="user",
            tier="vip",
            vip_expires_at=expires_sec,
            created_at=now_sec,
            updated_at=now_sec
        )
        db.add(db_user)
    else:
        db_user.tier = "vip"
        db_user.vip_expires_at = expires_sec
        db_user.updated_at = now_sec

    await db.commit()

    return MeResponse(
        uid=user.uid,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
        tier="vip",
        expires_at=expires_sec,
        is_vip=True
    )
