from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from sqlalchemy import or_, and_
import uuid
import os

from app.db import get_db
from app.models.chat import ChatRoom, ChatMessage
from app.models.user import User

router = APIRouter(prefix="/v1/chat", tags=["chat"])


# =================================================================
# 업로드 폴더 (자동 생성)
# =================================================================
UPLOAD_DIR = "uploads/chat"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_IMAGE_SIZE = 10 * 1024 * 1024
MAX_VIDEO_SIZE = 50 * 1024 * 1024

IMAGE_TYPES = [
    "image/jpeg", "image/jpg", "image/png",
    "image/webp", "image/heic", "image/heif"
]
VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/mov"]


# =================================================================
# 0) 업로드 API — 이미지 / 영상 파일 저장
# =================================================================
@router.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    content = await file.read()
    size = len(content)

    ext = file.filename.split(".")[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # 이미지
    if file.content_type in IMAGE_TYPES:
        if size > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail="IMAGE_TOO_LARGE")

    # 영상
    elif file.content_type in VIDEO_TYPES:
        if size > MAX_VIDEO_SIZE:
            raise HTTPException(status_code=400, detail="VIDEO_TOO_LARGE")

    else:
        raise HTTPException(status_code=400, detail="UNSUPPORTED_FILE_TYPE")

    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/static/chat/{filename}"}


# =================================================================
# 1) DM 방 생성 or 가져오기
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

    #  무조건 배열로 변환해서 JSON으로 보냄
    return [
        {
            "id": m.id,
            "room_id": m.room_id,
            "sender_id": m.sender_id,
            "message": m.message,
            "media_url": m.media_url,
            "thumbnail_url": m.thumbnail_url,
            "media_type": m.media_type,
            "media_urls": m.media_urls,
            "read": m.read,
            "created_at": m.created_at.isoformat(),
        }
        for m in msgs
    ]

# =================================================================
# 3) REST 방식 단일 메시지 전송 (프론트에서는 사용 X)
# =================================================================
@router.post("/rooms/{room_id}/messages")
def send_message(
    room_id: int,
    sender_id: int,
    message: str = "",
    media_url: str = None,
    thumbnail_url: str = None,
    media_type: str = None,
    media_urls: list = None,
    db: Session = Depends(get_db),
):
    msg = ChatMessage(
        room_id=room_id,
        sender_id=sender_id,
        message=message or None,
        media_url=media_url,
        thumbnail_url=thumbnail_url,
        media_type=media_type,
        media_urls=media_urls,
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# =================================================================
# 4) WebSocket 메시지 전송 (  핵심 multi-image 지원)
# =================================================================

active_connections = {}  # {"room_id": [ws1, ws2]}

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: int, db: Session = Depends(get_db)):
    await websocket.accept()
    room_key = str(room_id)

    if room_key not in active_connections:
        active_connections[room_key] = []
    active_connections[room_key].append(websocket)

    print("WS CONNECT:", room_key)

    try:
        while True:
            data = await websocket.receive_json()

            # ======================================================
            #  1) read_receipt (카카오톡/DM 방식)
            # ======================================================
            if data.get("type") == "read_receipt":
                reader_id = data["user_id"]
                last_read_id = data["last_read_id"]

                # last_read_id 이하의 메시지만 read 처리
                db.query(ChatMessage).filter(
                    ChatMessage.room_id == room_id,
                    ChatMessage.sender_id != reader_id,
                    ChatMessage.id <= last_read_id,
                    ChatMessage.read == False
                ).update({ChatMessage.read: True})

                db.commit()

                # 상대방에게 방송
                for ws in list(active_connections.get(room_key, [])):
                    try:
                        await ws.send_json({
                            "type": "read_receipt",
                            "user_id": reader_id,
                            "last_read_id": last_read_id
                        })
                    except:
                        active_connections[room_key].remove(ws)

                continue

            # ======================================================
            #  2) 일반 메시지 저장
            # ======================================================
            msg = ChatMessage(
                room_id=room_id,
                sender_id=data.get("sender_id"),
                message=data.get("message"),
                media_url=data.get("media_url"),
                thumbnail_url=data.get("thumbnail_url"),
                media_type=data.get("media_type"),
                media_urls=data.get("media_urls"),
                created_at=datetime.utcnow(),
                read=False
            )

            db.add(msg)
            db.commit()
            db.refresh(msg)

            # ======================================================
            #  3) 메시지 broadcast
            # ======================================================
            payload = {
                "type": "message",
                "id": msg.id,
                "room_id": msg.room_id,
                "sender_id": msg.sender_id,
                "message": msg.message,
                "media_url": msg.media_url,
                "thumbnail_url": msg.thumbnail_url,
                "media_type": msg.media_type,
                "media_urls": msg.media_urls,
                "read": msg.read,
                "created_at": msg.created_at.isoformat(),
            }

            for ws in list(active_connections.get(room_key, [])):
                try:
                    await ws.send_json(payload)
                except:
                    active_connections[room_key].remove(ws)

    except WebSocketDisconnect:
        print("WS DISC:", room_key)

    finally:
        if websocket in active_connections.get(room_key, []):
            active_connections[room_key].remove(websocket)

        if not active_connections.get(room_key):
            active_connections.pop(room_key, None)

        print("WS CLOSED:", room_key)



# =================================================================
# 5) 내 DM 리스트
# =================================================================
@router.get("/my-rooms")
def get_my_rooms(user_id: int, db: Session = Depends(get_db)):
    rooms = (
        db.query(ChatRoom)
        .filter(or_(ChatRoom.user1_id == user_id, ChatRoom.user2_id == user_id))
        .all()
    )

    result = []
    for room in rooms:
        opponent_id = room.user2_id if room.user1_id == user_id else room.user1_id
        opponent = db.query(User).filter(User.id == opponent_id).first()

        #   마지막 메시지
        last_msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.room_id == room.id)
            .order_by(ChatMessage.created_at.desc())
            .first()
        )

        #   읽지 않은 메시지 개수(unread_count) 계산
        unread_count = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.room_id == room.id,
                ChatMessage.sender_id != user_id,   # 내가 보낸 것은 제외
                ChatMessage.read == False           # 아직 읽지 않은 메시지만
            )
            .count()
        )

        result.append({
            "room_id": room.id,
            "opponent_id": opponent_id,
            "opponent_name": opponent.name if opponent else None,
            "opponent_profile": opponent.profile_image if opponent else None,

            "last_message": last_msg.message if last_msg else None,
            "last_media_type": last_msg.media_type if last_msg else None,
            "last_media_url": last_msg.media_url if last_msg else None,
            "last_media_urls": last_msg.media_urls if last_msg else None,
            "last_thumbnail_url": last_msg.thumbnail_url if last_msg else None,

            #   추가된 unread_count
            "unread_count": unread_count,

            "updated_at": room.updated_at
        })

    return result


# =================================================================
# 6) 채팅방 삭제 API
# =================================================================
@router.delete("/rooms/{room_id}")
def delete_room(room_id: int, user_id: int, db: Session = Depends(get_db)):
    # 방 가져오기
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="ROOM_NOT_FOUND")

    # 사용자 권한 체크 (방의 user1 또는 user2만 삭제 가능)
    if room.user1_id != user_id and room.user2_id != user_id:
        raise HTTPException(status_code=403, detail="NOT_ALLOWED")

    # 메시지 먼저 삭제
    db.query(ChatMessage).filter(ChatMessage.room_id == room_id).delete()

    # 방 삭제
    db.delete(room)
    db.commit()

    return {"status": "ok", "deleted_room_id": room_id}

@router.post("/rooms/{room_id}/read")
def mark_as_read(room_id: int, user_id: int, db: Session = Depends(get_db)):
    db.query(ChatMessage).filter(
        ChatMessage.room_id == room_id,
        ChatMessage.sender_id != user_id,   # 내가 보낸 건 제외
        ChatMessage.read == False
    ).update({ChatMessage.read: True})

    db.commit()
    return {"status": "ok"}

