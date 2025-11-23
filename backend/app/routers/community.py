from fastapi import APIRouter, Depends, HTTPException, UploadFile, Form, File
from sqlalchemy.orm import Session
import os, uuid, shutil, json

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


# ================================================
# 게시글 생성
# ================================================
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
        category=category,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return {"post_id": post.id}


# ================================================
# 이미지 업로드
# ================================================
@router.post("/posts/{post_id}/images")
def upload_post_images(
    post_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ext = file.filename.split(".")[-1]
    filename = f"{post_id}_{uuid.uuid4()}.{ext}"
    save_path = os.path.join(UPLOAD_DIR, filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    img = ReformImage(post_id=post_id, image_url=filename)
    db.add(img)
    db.commit()

    return {
        "url": f"{BASE_URL}/uploads/community/{filename}",
        "image_id": img.id,
    }


# ================================================
# 🔥 이미지 삭제 (수정 시 X 누른 사진)
# ================================================
@router.delete("/posts/{post_id}/images/{image_id}")
def delete_image(post_id: int, image_id: int, user_id: int, db: Session = Depends(get_db)):
    post = db.query(ReformPost).filter(ReformPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    if post.user_id != user_id:
        raise HTTPException(403, "Not allowed")

    img = db.query(ReformImage).filter(
        ReformImage.id == image_id,
        ReformImage.post_id == post_id,
    ).first()

    if not img:
        raise HTTPException(404, "Image not found")

    file_path = os.path.join(UPLOAD_DIR, img.image_url)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(img)
    db.commit()

    return {"status": "deleted", "image_id": image_id}


# ================================================
# 피드 리스트 조회
# ================================================
@router.get("/posts")
def list_posts(
    db: Session = Depends(get_db),
    sort: str = "latest",
    user_id: int | None = None
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
        liked = False
        if user_id:
            liked = (
                db.query(ReformLike)
                .filter(ReformLike.post_id == p.id, ReformLike.user_id == user_id)
                .first()
                is not None
            )

        results.append({
            "id": p.id,
            "user_id": p.user_id,
            "user_name": p.user.name,
            "profile_image": p.user.profile_image,
            "description": p.description,
            "category": p.category,
            "images": [
                f"{BASE_URL}/uploads/community/{i.image_url}"
                for i in p.images
            ],
            "like_count": len(p.likes),
            "liked": liked,
            "comment_count": len(p.comments),
            "created_at": p.created_at,
        })

    return results


# ================================================
# 게시글 상세
# ================================================
@router.get("/posts/{post_id}")
def post_detail(post_id: int, user_id: int | None = None, db: Session = Depends(get_db)):
    post = db.query(ReformPost).filter(ReformPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    liked = False
    if user_id:
        liked = db.query(ReformLike).filter(
            ReformLike.post_id == post_id,
            ReformLike.user_id == user_id
        ).first() is not None

    return {
        "id": post.id,
        "user_id": post.user_id,
        "user_name": post.user.name,
        "profile_image": post.user.profile_image,
        "description": post.description,
        "images": [
            {
                "id": img.id,
                "url": f"{BASE_URL}/uploads/community/{img.image_url}",
            }
            for img in post.images
        ],
        "like_count": len(post.likes),
        "liked": liked,
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


# ================================================
# 좋아요 토글
# ================================================
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


# ================================================
# 댓글 작성
# ================================================
@router.post("/posts/{post_id}/comments")
def write_comment(
    post_id: int,
    user_id: int = Form(...),
    comment: str = Form(...),
    db: Session = Depends(get_db),
):
    c = ReformComment(post_id=post_id, user_id=user_id, comment=comment)
    db.add(c)
    db.commit()

    return {"status": "ok"}


# ================================================
# 유저별 게시물 조회
# ================================================
@router.get("/users/{user_id}/posts")
def posts_by_user(user_id: int, db: Session = Depends(get_db)):
    posts = db.query(ReformPost).filter(ReformPost.user_id == user_id).all()
    return [
        {
            "id": p.id,
            "images": [
                f"{BASE_URL}/uploads/community/{i.image_url}"
                for i in p.images
            ],
        }
        for p in posts
    ]


# ================================================
# 게시글 삭제
# ================================================
@router.delete("/posts/{post_id}")
def delete_post(post_id: int, user_id: int, db: Session = Depends(get_db)):
    post = db.query(ReformPost).filter(ReformPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    if post.user_id != user_id:
        raise HTTPException(403, "Not allowed")

    # 이미지 삭제
    images = db.query(ReformImage).filter(ReformImage.post_id == post_id).all()
    for img in images:
        file_path = os.path.join(UPLOAD_DIR, img.image_url)
        if os.path.exists(file_path):
            os.remove(file_path)
        db.delete(img)

    # 댓글 삭제
    db.query(ReformComment).filter(ReformComment.post_id == post_id).delete()

    # 좋아요 삭제
    db.query(ReformLike).filter(ReformLike.post_id == post_id).delete()

    # 게시글 삭제
    db.delete(post)
    db.commit()

    return {"status": "deleted"}


# ================================================
# 게시글 수정 (🔥 이미지 삭제/추가 반영)
# ================================================
@router.put("/posts/{post_id}")
def update_post(
    post_id: int,
    user_id: int = Form(...),
    description: str = Form(...),
    kept_images: str = Form("[]"),
    new_images: list[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    post = db.query(ReformPost).filter(ReformPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")

    if post.user_id != user_id:
        raise HTTPException(403, "Not allowed")

    post.description = description

    kept_list = json.loads(kept_images)  # [image_id1, image_id2]

    existing = db.query(ReformImage).filter(ReformImage.post_id == post_id).all()

    # 기존 이미지 정리: kept에 없는 것 삭제
    for img in existing:
        if img.id not in kept_list:
            file_path = os.path.join(UPLOAD_DIR, img.image_url)
            if os.path.exists(file_path):
                os.remove(file_path)
            db.delete(img)

    # 새 이미지 업로드
    if new_images:
        for file in new_images:
            ext = file.filename.split(".")[-1]
            filename = f"{post_id}_{uuid.uuid4()}.{ext}"
            save_path = os.path.join(UPLOAD_DIR, filename)

            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            db.add(ReformImage(post_id=post_id, image_url=filename))

    db.commit()

    return {"status": "updated", "post_id": post_id}
