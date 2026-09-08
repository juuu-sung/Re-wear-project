from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db import Base

class LaundryBasket(Base):
    __tablename__ = "laundry_baskets"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    clothes_id = Column(Integer, ForeignKey("clothes.id"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 관계
    user = relationship("User", back_populates="laundry_baskets")
    clothes = relationship("Clothes", back_populates="laundry_baskets")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "clothes_id",
            name="uq_user_clothes_basket"
        ),
    )
