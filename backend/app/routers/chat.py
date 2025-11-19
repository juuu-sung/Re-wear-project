from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime
from sqlalchemy import or_, and_

from app.db import get_db
from app.models.chat import ChatRoom, ChatMessage

router = APIRouter(prefix="/v1/chat", tags=["chat"])

# =================================================================
# 1) 기존 DM 방 조회 또는 생성
# =================================================================
@router.get("/room")
def get_or_create_room(user1: int, user2: int, db: Session = Depends(get_db)):
    room = (
        db.query(ChatRoom)
        .filter(
            or_(
                and_(ChatRoom.user1_id == user1, ChatRoom.user2_id == user2),
                and_(ChatRoom.user1_id == user2, ChatRoom.user2_id == user1),
            )
        )
        .first()
    )

    if room:
        return {"room_id": room.id}

    new_room = ChatRoom(user1_id=user1, user2_id=user2)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return {"room_id": new_room.id}


# =================================================================
# 2) 메시지 조회
# =================================================================
@router.get("/rooms/{room_id}/messages")
def get_messages(room_id: int, db: Session = Depends(get_db)):
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return msgs


# =================================================================
# 3) 메시지 전송 API
# =================================================================
@router.post("/rooms/{room_id}/messages")
def send_message(room_id: int, sender_id: int, message: str, db: Session = Depends(get_db)):
    msg = ChatMessage(
        room_id=room_id,
        sender_id=sender_id,
        message=message,
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# =================================================================
# 4) WebSocket 안정 버전
# =================================================================

active_connections = {}  # {"123": [ws1, ws2]}

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    db: Session = Depends(get_db)
):
    await websocket.accept()
    room_key = str(room_id)

    if room_key not in active_connections:
        active_connections[room_key] = []

    active_connections[room_key].append(websocket)
    print("WS CONNECTED", room_key)

    try:
        while True:
            data = await websocket.receive_json()

            # DB 저장
            msg = ChatMessage(
                room_id=room_id,
                sender_id=data.get("sender_id"),
                message=data.get("message"),
                created_at=datetime.utcnow(),
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)

            payload = {
                "id": msg.id,
                "room_id": room_id,
                "sender_id": msg.sender_id,
                "message": msg.message,
                "created_at": msg.created_at.isoformat(),
            }

            # 브로드캐스트
            for ws in list(active_connections[room_key]):
                try:
                    await ws.send_json(payload)
                except:
                    active_connections[room_key].remove(ws)

    except WebSocketDisconnect:
        print("WS DISCONNECT", room_key)

    except Exception as e:
        print("WS ERROR:", e)

    finally:
        print("WS FINALLY CLEANUP", room_key)

        # 이 방에서 제거
        if websocket in active_connections.get(room_key, []):
            active_connections[room_key].remove(websocket)

        # 방이 비었으면 목록 삭제
        if room_key in active_connections and len(active_connections[room_key]) == 0:
            del active_connections[room_key]

        # ❌ close() 절대 호출하지 않음!
        # Starlette가 자동으로 close handshake 처리함



# =================================================================
# 5) 내 방 목록 (DM 리스트)
# =================================================================
@router.get("/my-rooms")
def get_my_rooms(user_id: int, db: Session = Depends(get_db)):
    from app.models.user import User

    rooms = (
        db.query(ChatRoom)
        .filter(
            or_(
                ChatRoom.user1_id == user_id,
                ChatRoom.user2_id == user_id
            )
        )
        .all()
    )

    result = []
    for room in rooms:
        opponent_id = room.user2_id if room.user1_id == user_id else room.user1_id

        opponent = db.query(User).filter(User.id == opponent_id).first()

        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.room_id == room.id)
            .order_by(ChatMessage.created_at.desc())
            .first()
        )

        result.append({
            "room_id": room.id,
            "opponent_id": opponent_id,
            "opponent_name": opponent.name if opponent else None,
            "opponent_profile": opponent.profile_image if opponent else None,   # ← 핵심
            "last_message": last_msg.message if last_msg else None,
            "updated_at": room.updated_at
        })

    return result
