from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from sqlalchemy.orm import Session
import os, uuid, shutil

from app.db import get_db
from app.models.community import (
    ReformPost,
    ReformImage,
    ReformComment,
    ReformLike,
)
from app.models.user import User

router = APIRouter(prefix="/v1/community", tags=["community"])

UPLOAD_DIR = "uploads/community"
os.makedirs(UPLOAD_DIR, exist_ok=True)

BASE_URL = os.getenv("EXTERNAL_BASE_URL")


# -------------------------------------------------------------
# 게시글 생성
# -------------------------------------------------------------
@router.post("/posts")
def create_post(
    user_id: int = Form(...),
    description: str = Form(...),
    category: str = Form(None),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    post = ReformPost(
        user_id=user_id,
        description=description,
        category=category
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return {"post_id": post.id}


# -------------------------------------------------------------
# 이미지 업로드
# -------------------------------------------------------------
@router.post("/posts/{post_id}/images")
async def upload_post_images(
    post_id: int,
    is_before: bool = Form(False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ext = file.filename.split(".")[-1]
    filename = f"{post_id}_{uuid.uuid4()}.{ext}"
    save_path = os.path.join(UPLOAD_DIR, filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    img = ReformImage(
        post_id=post_id,
        image_url=filename,
        is_before=is_before
    )
    db.add(img)
    db.commit()

    return {
        "url": f"{BASE_URL}/uploads/community/{filename}"
    }


# -------------------------------------------------------------
# 전체 피드 조회 — liked 포함, user_id=None 허용
# -------------------------------------------------------------
@router.get("/posts")
def list_posts(
    db: Session = Depends(get_db),
    sort: str = "latest",
    user_id: int | None = None   # ← user_id null 허용
):
    q = db.query(ReformPost)

    if sort == "popular":
        q = q.outerjoin(ReformLike).group_by(ReformPost.id).order_by(
            db.func.count(ReformLike.id).desc()
        )
    else:
        q = q.order_by(ReformPost.created_at.desc())

    posts = q.all()
    results = []

    for p in posts:
        # 좋아요 여부
        if user_id:
            liked = (
                db.query(ReformLike)
                .filter(
                    ReformLike.post_id == p.id,
                    ReformLike.user_id == user_id
                )
                .first()
                is not None
            )
        else:
            liked = False

        results.append({
            "id": p.id,
            "user_id": p.user_id,
            "user_name": p.user.name,
            "profile_image": p.user.profile_image,
            "description": p.description,
            "category": p.category,
            "images": [
                f"{BASE_URL}/uploads/community/{img.image_url}"
                for img in p.images
            ],
            "like_count": len(p.likes),
            "liked": liked,
            "comment_count": len(p.comments),
            "created_at": p.created_at,
        })

    return results


# -------------------------------------------------------------
# 게시글 상세
# -------------------------------------------------------------
@router.get("/posts/{post_id}")
def post_detail(post_id: int, user_id: int | None = None, db: Session = Depends(get_db)):
    post = db.query(ReformPost).filter(ReformPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    if user_id:
        liked = db.query(ReformLike).filter(
            ReformLike.post_id == post_id,
            ReformLike.user_id == user_id
        ).first() is not None
    else:
        liked = False

    return {
        "id": post.id,
        "user_id": post.user_id,
        "user_name": post.user.name,
        "profile_image": post.user.profile_image,
        "description": post.description,
        "images": [
            {
                "url": f"{BASE_URL}/uploads/community/{i.image_url}",
                "is_before": i.is_before,
            }
            for i in post.images
        ],
        "like_count": len(post.likes),
        "liked": liked,   # 중요
        "comments": [
            {
                "user_id": c.user_id,
                "user_name": c.user.name,
                "comment": c.comment,
                "created_at": c.created_at,
            }
            for c in post.comments
        ],
    }


# -------------------------------------------------------------
# 좋아요 토글 — like_count 반환
# -------------------------------------------------------------
@router.post("/posts/{post_id}/like")
def toggle_like(post_id: int, user_id: int, db: Session = Depends(get_db)):
    existing = (
        db.query(ReformLike)
        .filter(ReformLike.post_id == post_id, ReformLike.user_id == user_id)
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        like_count = db.query(ReformLike).filter(ReformLike.post_id == post_id).count()
        return {"liked": False, "like_count": like_count}

    new_like = ReformLike(post_id=post_id, user_id=user_id)
    db.add(new_like)
    db.commit()
    like_count = db.query(ReformLike).filter(ReformLike.post_id == post_id).count()

    return {"liked": True, "like_count": like_count}


# -------------------------------------------------------------
# 댓글
# -------------------------------------------------------------
@router.post("/posts/{post_id}/comments")
def write_comment(
    post_id: int,
    user_id: int,
    comment: str,
    db: Session = Depends(get_db),
):
    c = ReformComment(post_id=post_id, user_id=user_id, comment=comment)
    db.add(c)
    db.commit()
    return {"status": "ok"}


# -------------------------------------------------------------
# 유저별 게시물
# -------------------------------------------------------------
@router.get("/users/{user_id}/posts")
def posts_by_user(user_id: int, db: Session = Depends(get_db)):
    posts = db.query(ReformPost).filter(ReformPost.user_id == user_id).all()
    return [
        {
            "id": p.id,
            "images": [
                f"{BASE_URL}/uploads/community/{img.image_url}"
                for img in p.images
            ],
        }
        for p in posts
    ]
