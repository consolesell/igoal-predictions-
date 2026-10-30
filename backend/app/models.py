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
