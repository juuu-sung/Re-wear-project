from sqlalchemy.orm import Session
from app.models import Clothes, Event

def get_user_clothes(db: Session, user_id: int):
    return db.query(Clothes).filter(Clothes.user_id == user_id).all()

def get_last_wash(db: Session, cloth_id: int):
    return (
        db.query(Event)
        .filter(Event.garment_id == cloth_id, Event.type == "wash")
        .order_by(Event.date.desc())
        .first()
    )

def get_wear_events(db: Session, cloth_id: int):
    return (
        db.query(Event)
        .filter(Event.garment_id == cloth_id, Event.type == "wear")
        .order_by(Event.date.desc())
        .all()
    )
