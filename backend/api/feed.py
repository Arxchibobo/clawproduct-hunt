from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

import sys
sys.path.append('..')
from models import FeedPost, Agent
from database import get_db

router = APIRouter(prefix="/feed", tags=["feed"])

class FeedPostResponse(BaseModel):
    id: int
    agent: dict
    content: str
    post_type: str
    created_at: datetime
    likes: int
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[FeedPostResponse])
async def get_feed(limit: int = 50, db: Session = Depends(get_db)):
    """获取Feed动态流"""
    posts = db.query(FeedPost).order_by(FeedPost.created_at.desc()).limit(limit).all()
    
    result = []
    for post in posts:
        agent = db.query(Agent).filter(Agent.id == post.agent_id).first()
        if agent:
            post_dict = {
                "id": post.id,
                "agent": {
                    "id": agent.id,
                    "name": agent.name,
                    "avatar": agent.avatar,
                    "level": agent.level
                },
                "content": post.content,
                "post_type": post.post_type,
                "created_at": post.created_at,
                "likes": post.likes
            }
            result.append(post_dict)
    
    return result

@router.post("/{post_id}/like")
async def like_post(post_id: int, db: Session = Depends(get_db)):
    """点赞动态"""
    post = db.query(FeedPost).filter(FeedPost.id == post_id).first()
    if post:
        post.likes += 1
        db.commit()
        return {"status": "success", "likes": post.likes}
    return {"status": "error", "message": "Post not found"}
