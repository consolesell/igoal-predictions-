import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.models import Club, Fixture
from backend.app.schemas import ClubItem, ClubsListResponse, ClubCreate, ClubLogoUploadRequest
from backend.app.auth import get_admin_user, AuthUser, record_audit_log
from backend.app.config import settings

router = APIRouter(tags=["Clubs & Logos"])

# ------------------------------------------------------------------------------
# Public Club Endpoints
# ------------------------------------------------------------------------------

@router.get("/clubs", response_model=ClubsListResponse)
async def list_clubs(db: AsyncSession = Depends(get_db)):
    """
    Returns directory of football clubs with names, country, and logo URLs.
    """
    stmt = select(Club).order_by(Club.name.asc())
    res = await db.execute(stmt)
    records = res.scalars().all()
    items = []
    for r in records:
        updated_epoch = int(r.updated_at.timestamp()) if r.updated_at else None
        items.append(
            ClubItem(
                id=r.id,
                name=r.name,
                short_name=r.short_name,
                country=r.country,
                logo_path=r.logo_path,
                logo_url=r.logo_url,
                updated_at=updated_epoch
            )
        )
    return ClubsListResponse(clubs=items)


@router.get("/clubs/{club_id}", response_model=ClubItem)
async def get_club(club_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Club).where(Club.id == club_id)
    club = (await db.execute(stmt)).scalar_one_or_none()
    if not club:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Club with ID '{club_id}' not found."}
        )
    updated_epoch = int(club.updated_at.timestamp()) if club.updated_at else None
    return ClubItem(
        id=club.id,
        name=club.name,
        short_name=club.short_name,
        country=club.country,
        logo_path=club.logo_path,
        logo_url=club.logo_url,
        updated_at=updated_epoch
    )

# ------------------------------------------------------------------------------
# Admin Club Management & Logo Upload (Phase 2)
# ------------------------------------------------------------------------------

@router.post("/admin/clubs", response_model=ClubItem)
async def create_club(
    payload: ClubCreate,
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    club_id = payload.id or f"club_{payload.short_name.lower().replace(' ', '_')}"
    existing = (await db.execute(select(Club).where(Club.id == club_id))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail={"error": f"Club '{club_id}' already exists."})

    logo_path = f"clubs/{club_id}/logo.png"
    logo_url = payload.logo_url or f"{settings.FIREBASE_STORAGE_BASE_URL}/{logo_path}"

    club = Club(
        id=club_id,
        name=payload.name,
        short_name=payload.short_name,
        country=payload.country,
        logo_path=logo_path,
        logo_url=logo_url
    )
    db.add(club)
    await db.commit()
    await db.refresh(club)

    await record_audit_log(
        db=db,
        actor_id=admin.uid,
        action="CLUB_CREATE",
        target_type="club",
        target_id=club.id,
        details={"name": club.name, "short_name": club.short_name}
    )

    return ClubItem(
        id=club.id,
        name=club.name,
        short_name=club.short_name,
        country=club.country,
        logo_path=club.logo_path,
        logo_url=club.logo_url,
        updated_at=int(club.updated_at.timestamp())
    )


@router.post("/admin/clubs/{club_id}/logo", response_model=ClubItem)
async def upload_club_logo(
    club_id: str,
    payload: ClubLogoUploadRequest,
    admin: AuthUser = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sets or updates club logo in Firebase Storage path 'clubs/{clubId}/logo.png'
    and automatically refreshes denormalized logo URLs across all matching fixtures!
    """
    stmt = select(Club).where(Club.id == club_id)
    club = (await db.execute(stmt)).scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=404, detail={"error": f"Club '{club_id}' not found."})

    storage_path = f"clubs/{club.id}/logo.png"
    final_url = payload.logo_url or f"{settings.FIREBASE_STORAGE_BASE_URL}/{storage_path}"

    club.logo_path = storage_path
    club.logo_url = final_url

    # Auto-refresh denormalized logos on fixtures
    # 1. Home fixtures
    await db.execute(
        update(Fixture)
        .where(Fixture.home_club_id == club.id)
        .values(home_logo_url=final_url)
    )
    # 2. Away fixtures
    await db.execute(
        update(Fixture)
        .where(Fixture.away_club_id == club.id)
        .values(away_logo_url=final_url)
    )

    await db.commit()
    await db.refresh(club)

    await record_audit_log(
        db=db,
        actor_id=admin.uid,
        action="LOGO_UPLOAD",
        target_type="club",
        target_id=club.id,
        details={"logo_path": storage_path, "logo_url": final_url}
    )

    return ClubItem(
        id=club.id,
        name=club.name,
        short_name=club.short_name,
        country=club.country,
        logo_path=club.logo_path,
        logo_url=club.logo_url,
        updated_at=int(club.updated_at.timestamp())
    )
