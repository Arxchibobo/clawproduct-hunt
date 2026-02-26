from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime, timedelta
import json
import re
import html

import sys
sys.path.append('..')
from models import Agent, FeedPost
from database import get_db
from websocket.manager import manager

router = APIRouter(prefix="/agents", tags=["agents"])

# 输入验证辅助函数
def sanitize_html(text: str) -> str:
    """清理HTML，防止XSS攻击"""
    return html.escape(text.strip())

def validate_agent_name(name: str) -> str:
    """验证Agent名称"""
    name = name.strip()
    if not re.match(r'^[a-zA-Z0-9_-]+$', name):
        raise ValueError("Agent name can only contain letters, numbers, hyphens and underscores")
    return name

# Pydantic schemas with validation
class AgentCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=50, description="Agent name")
    avatar: str = Field(default="🤖", max_length=10, description="Agent avatar (emoji)")
    bio: str = Field(default="", max_length=500, description="Agent biography")
    specialties: List[str] = Field(default=[], max_items=10, description="Agent skills")
    
    @validator('name')
    def validate_name(cls, v):
        return validate_agent_name(v)
    
    @validator('bio')
    def sanitize_bio(cls, v):
        return sanitize_html(v)
    
    @validator('specialties', each_item=True)
    def validate_specialty(cls, v):
        if len(v) > 50:
            raise ValueError("Each specialty must be less than 50 characters")
        return sanitize_html(v)

class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Post content")
    
    @validator('content')
    def sanitize_content(cls, v):
        return sanitize_html(v)

class AgentResponse(BaseModel):
    id: int
    name: str
    avatar: str
    bio: str
    specialties: List[str]
    reputation: int
    level: int
    total_tasks_completed: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[AgentResponse])
async def list_agents(
    skip: int = Field(default=0, ge=0),
    limit: int = Field(default=100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取所有Agent列表（带分页）"""
    agents = db.query(Agent).offset(skip).limit(limit).all()
    result = []
    for agent in agents:
        agent_dict = {
            "id": agent.id,
            "name": agent.name,
            "avatar": agent.avatar,
            "bio": agent.bio or "",
            "specialties": json.loads(agent.specialties) if agent.specialties else [],
            "reputation": agent.reputation,
            "level": agent.level,
            "total_tasks_completed": agent.total_tasks_completed,
            "status": agent.status,
            "created_at": agent.created_at
        }
        result.append(agent_dict)
    return result

@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(agent_data: AgentCreate, db: Session = Depends(get_db)):
    """创建新Agent"""
    # 检查名字是否已存在
    existing = db.query(Agent).filter(Agent.name == agent_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Agent name '{agent_data.name}' already exists"
        )
    
    # 限制Agent总数（防止滥用）
    agent_count = db.query(Agent).count()
    if agent_count >= 1000:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Agent limit reached. Please contact support."
        )
    
    # 创建新Agent
    new_agent = Agent(
        name=agent_data.name,
        avatar=agent_data.avatar,
        bio=agent_data.bio,
        specialties=json.dumps(agent_data.specialties),
        status="idle"
    )
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    
    # 发布欢迎动态
    welcome_post = FeedPost(
        agent_id=new_agent.id,
        content=f"👋 Hello! I'm {new_agent.name}. {agent_data.bio}",
        post_type="status"
    )
    db.add(welcome_post)
    db.commit()
    
    # 广播新Agent加入
    await manager.broadcast_agent_status({
        "event": "agent_joined",
        "agent": {
            "id": new_agent.id,
            "name": new_agent.name,
            "avatar": new_agent.avatar
        }
    })
    
    result = {
        "id": new_agent.id,
        "name": new_agent.name,
        "avatar": new_agent.avatar,
        "bio": new_agent.bio or "",
        "specialties": json.loads(new_agent.specialties) if new_agent.specialties else [],
        "reputation": new_agent.reputation,
        "level": new_agent.level,
        "total_tasks_completed": new_agent.total_tasks_completed,
        "status": new_agent.status,
        "created_at": new_agent.created_at
    }
    return result

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: int = Field(..., gt=0), db: Session = Depends(get_db)):
    """获取单个Agent详情"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with id {agent_id} not found"
        )
    
    result = {
        "id": agent.id,
        "name": agent.name,
        "avatar": agent.avatar,
        "bio": agent.bio or "",
        "specialties": json.loads(agent.specialties) if agent.specialties else [],
        "reputation": agent.reputation,
        "level": agent.level,
        "total_tasks_completed": agent.total_tasks_completed,
        "status": agent.status,
        "created_at": agent.created_at
    }
    return result

@router.post("/{agent_id}/post")
async def create_post(
    agent_id: int = Field(..., gt=0),
    post_data: PostCreate = None,
    db: Session = Depends(get_db)
):
    """Agent发布动态"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with id {agent_id} not found"
        )
    
    # 速率限制：检查最近的发帖频率（每分钟最多10条）
    recent_posts_count = db.query(FeedPost).filter(
        FeedPost.agent_id == agent_id,
        FeedPost.created_at >= datetime.utcnow() - timedelta(minutes=1)
    ).count()
    
    if recent_posts_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many posts. Please wait a moment."
        )
    
    post = FeedPost(
        agent_id=agent_id,
        content=post_data.content,
        post_type="status"
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    
    # 广播新动态
    await manager.broadcast_feed_post({
        "id": post.id,
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "avatar": agent.avatar
        },
        "content": post.content,
        "post_type": post.post_type,
        "created_at": post.created_at.isoformat(),
        "likes": post.likes
    })
    
    return {"status": "success", "post_id": post.id}
