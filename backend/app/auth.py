import time
import json
from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import User, AuditLog

class AuthUser:
    def __init__(self, uid: str, email: Optional[str], display_name: Optional[str], role: str, tier: str, vip_expires_at: Optional[int]):
        self.uid = uid
        self.email = email
        self.display_name = display_name
        self.role = role
        self.tier = tier
        self.vip_expires_at = vip_expires_at

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    @property
    def is_vip(self) -> bool:
        if self.role == "admin":
            return True
        if self.tier == "vip":
            now = int(time.time())
            return self.vip_expires_at is None or self.vip_expires_at > now
        return False

async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[AuthUser]:
    """
    Extracts user identity from Authorization header if present.
    Supports static admin token, VIP user tokens, or DB-backed user accounts.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split("Bearer ", 1)[1].strip()

    # 1. Master Admin Token Check
    if token == settings.ADMIN_TOKEN:
        return AuthUser(
            uid="admin_master",
            email="admin@igoalpredictions.com",
            display_name="System Administrator",
            role="admin",
            tier="vip",
            vip_expires_at=None
        )

    # 2. Test / Mock token formats (e.g. token_vip_user123, token_free_user456)
    if token.startswith("token_vip_") or token == "demo_vip_token":
        uid = token.replace("token_vip_", "vip_")
        return AuthUser(
            uid=uid,
            email=f"{uid}@example.com",
            display_name="VIP Subscriber",
            role="user",
            tier="vip",
            vip_expires_at=int(time.time()) + (30 * 86400)
        )

    if token.startswith("token_free_") or token == "demo_free_token":
        uid = token.replace("token_free_", "free_")
        return AuthUser(
            uid=uid,
            email=f"{uid}@example.com",
            display_name="Free User",
            role="user",
            tier="free",
            vip_expires_at=None
        )

    # 3. Database user lookup by UID / token
    stmt = select(User).where(User.uid == token)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if user:
        return AuthUser(
            uid=user.uid,
            email=user.email,
            display_name=user.display_name,
            role=user.role,
            tier=user.tier,
            vip_expires_at=user.vip_expires_at
        )

    # Unrecognized token
    return None

async def get_current_user(
    user: Optional[AuthUser] = Depends(get_current_user_optional)
) -> AuthUser:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Authentication required. Please provide a valid Bearer token."}
        )
    return user

async def get_admin_user(
    authorization: Optional[str] = Header(None),
    user: Optional[AuthUser] = Depends(get_current_user_optional)
) -> AuthUser:
    """
    Guarantees caller is an authorized administrator.
    Rejects unauthorized calls with 401 or 403.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Admin authentication required. Missing Authorization header."}
        )
    
    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Forbidden: Administrator privileges required."}
        )

    return user

async def record_audit_log(
    db: AsyncSession,
    actor_id: str,
    action: str,
    target_type: str,
    target_id: str,
    details: Optional[dict] = None
):
    """
    Records an immutable audit entry for compliance, security, and traceability.
    """
    log_entry = AuditLog(
        id=f"audit_{int(time.time() * 1000)}_{target_id[:8]}",
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=json.dumps(details) if details else None,
        created_at=int(time.time())
    )
    db.add(log_entry)
    await db.commit()
