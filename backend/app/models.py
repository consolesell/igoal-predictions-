from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    BigInteger,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Club(Base):
    __tablename__ = "clubs"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    short_name = Column(String(30), nullable=False)
    country = Column(String(64), nullable=False)
    logo_path = Column(String(255), nullable=True)   # Firebase Storage path: clubs/{clubId}/logo.png
    logo_url = Column(String(512), nullable=True)    # Public CDN / Storage URL
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class Fixture(Base):
    __tablename__ = "fixtures"

    id = Column(String(64), primary_key=True, index=True)
    league = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    home = Column(String(100), nullable=False)
    away = Column(String(100), nullable=False)
    kickoff = Column(BigInteger, nullable=False, index=True)  # Unix epoch SECONDS
    status = Column(String(20), nullable=False, index=True)  # SCHEDULED, LIVE, FINISHED, POSTPONED
    home_goals = Column(Integer, nullable=True)
    away_goals = Column(Integer, nullable=True)
    minute = Column(Integer, nullable=True)
    home_club_id = Column(String(64), ForeignKey("clubs.id", ondelete="SET NULL"), nullable=True)
    away_club_id = Column(String(64), ForeignKey("clubs.id", ondelete="SET NULL"), nullable=True)
    home_logo_url = Column(String(512), nullable=True)
    away_logo_url = Column(String(512), nullable=True)
    deleted_at = Column(BigInteger, nullable=True, index=True)  # Unix epoch SECONDS (null = active)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    tips = relationship("Tip", back_populates="fixture", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("status IN ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED')", name="chk_fixture_status"),
    )


class Tip(Base):
    __tablename__ = "tips"

    id = Column(String(64), primary_key=True, index=True)
    fixture_id = Column(String(64), ForeignKey("fixtures.id", ondelete="CASCADE"), nullable=False, index=True)
    league = Column(String(100), nullable=False)
    home = Column(String(100), nullable=False)
    away = Column(String(100), nullable=False)
    kickoff = Column(BigInteger, nullable=False)  # Unix epoch SECONDS
    market = Column(String(64), nullable=False)
    selection = Column(String(64), nullable=False)
    confidence = Column(Integer, nullable=False)  # 0 to 100
    risk = Column(String(10), nullable=False)  # LOW, MEDIUM, HIGH
    explanation = Column(Text, nullable=False)
    published_at = Column(BigInteger, nullable=False, index=True)  # Unix epoch SECONDS
    model_version = Column(String(32), nullable=False)
    tier = Column(String(10), nullable=False, default="free", index=True)  # free, premium
    home_logo_url = Column(String(512), nullable=True)
    away_logo_url = Column(String(512), nullable=True)

    fixture = relationship("Fixture", back_populates="tips")
    settlement = relationship("SettlementResult", back_populates="tip", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("confidence >= 0 AND confidence <= 100", name="chk_tip_confidence"),
        CheckConstraint("risk IN ('LOW', 'MEDIUM', 'HIGH')", name="chk_tip_risk"),
        CheckConstraint("tier IN ('free', 'premium')", name="chk_tip_tier"),
    )


class SettlementResult(Base):
    __tablename__ = "settlement_results"

    prediction_id = Column(String(64), ForeignKey("tips.id", ondelete="CASCADE"), primary_key=True)
    status = Column(String(20), nullable=False)  # WON, LOST, VOID, POSTPONED
    home_goals = Column(Integer, nullable=False)
    away_goals = Column(Integer, nullable=False)
    settled_at = Column(BigInteger, nullable=False, index=True)  # Unix epoch SECONDS

    tip = relationship("Tip", back_populates="settlement")

    __table_args__ = (
        CheckConstraint("status IN ('WON', 'LOST', 'VOID', 'POSTPONED')", name="chk_settlement_status"),
    )


class User(Base):
    __tablename__ = "users"

    uid = Column(String(128), primary_key=True)
    email = Column(String(128), nullable=True)
    display_name = Column(String(128), nullable=True)
    role = Column(String(20), nullable=False, default="user")  # user, admin
    tier = Column(String(20), nullable=False, default="free", index=True)  # free, vip
    vip_expires_at = Column(BigInteger, nullable=True)  # Unix epoch SECONDS
    created_at = Column(BigInteger, nullable=False)
    updated_at = Column(BigInteger, nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin')", name="chk_user_role"),
        CheckConstraint("tier IN ('free', 'vip')", name="chk_user_tier"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True)
    actor_id = Column(String(128), nullable=False)
    action = Column(String(64), nullable=False)
    target_type = Column(String(32), nullable=False)
    target_id = Column(String(64), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(BigInteger, nullable=False, index=True)  # Unix epoch SECONDS
