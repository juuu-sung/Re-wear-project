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

# 🔥 로컬 저장 경로
UPLOAD_DIR = "uploads/community"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 🔥 반드시 절대 URL
BASE_URL = "https://lyrately-prefavorable-candyce.ngrok-free.dev"
    


# -----------------------
# 게시글 생성
# -----------------------
@router.post("/posts")
def create_post(
    user_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(None),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    post = ReformPost(
        user_id=user_id,
        title=title,
        description=description,
        category=category
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return {"post_id": post.id}


# -----------------------
# 이미지 업로드
# -----------------------
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

    # 파일 저장
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # DB에는 파일명만 저장
    img = ReformImage(
        post_id=post_id,
        image_url=filename,
        is_before=is_before
    )
    db.add(img)
    db.commit()

    # RN 확인용 절대 URL 반환
    return {
        "url": f"{BASE_URL}/uploads/community/{filename}"
    }


# -----------------------
# 전체 피드
# -----------------------
@router.get("/posts")
def list_posts(db: Session = Depends(get_db), sort: str = "latest"):
    q = db.query(ReformPost)

    if sort == "popular":
        q = q.outerjoin(ReformLike).group_by(ReformPost.id).order_by(
            db.func.count(ReformLike.id).desc()
        )
    else:
        q = q.order_by(ReformPost.created_at.desc())

    posts = q.all()

    return [
        {
            "id": p.id,
            "user_id": p.user_id,
            "user_name": p.user.name,
            "title": p.title,
            "description": p.description,

            # 🔥 절대 URL로 변환해서 RN에서도 바로 사용 가능
            "images": [
                f"{BASE_URL}/uploads/community/{img.image_url}"
                for img in p.images
            ],

            "like_count": len(p.likes),
            "comment_count": len(p.comments),
            "created_at": p.created_at
        }
        for p in posts
    ]


# -----------------------
# 상세조회
# -----------------------
@router.get("/posts/{post_id}")
def post_detail(post_id: int, db: Session = Depends(get_db)):
    post = db.query(ReformPost).filter(ReformPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    return {
        "id": post.id,
        "user_id": post.user_id,
        "user_name": post.user.name,
        "title": post.title,
        "description": post.description,

        "images": [
            {
                "url": f"{BASE_URL}/uploads/community/{i.image_url}",
                "is_before": i.is_before
            }
            for i in post.images
        ],

        "likes": len(post.likes),
        "comments": [
            {
                "user_id": c.user_id,
                "user_name": c.user.name,
                "comment": c.comment,
                "created_at": c.created_at
            }
            for c in post.comments
        ]
    }


# -----------------------
# 좋아요
# -----------------------
@router.post("/posts/{post_id}/like")
def like_post(post_id: int, user_id: int, db: Session = Depends(get_db)):
    like = ReformLike(post_id=post_id, user_id=user_id)
    db.add(like)
    db.commit()
    return {"status": "liked"}


# -----------------------
# 댓글
# -----------------------
@router.post("/posts/{post_id}/comments")
def write_comment(
    post_id: int,
    user_id: int,
    comment: str,
    db: Session = Depends(get_db)
):
    c = ReformComment(post_id=post_id, user_id=user_id, comment=comment)
    db.add(c)
    db.commit()
    return {"status": "ok"}


# -----------------------
# 특정 사용자의 게시글 (프로필)
# -----------------------
@router.get("/users/{user_id}/posts")
def posts_by_user(user_id: int, db: Session = Depends(get_db)):
    posts = db.query(ReformPost).filter(ReformPost.user_id == user_id).all()

    return [
        {
            "id": p.id,
            "images": [
                f"{BASE_URL}/uploads/community/{img.image_url}"
                for img in p.images
            ]
        }
        for p in posts
    ]
