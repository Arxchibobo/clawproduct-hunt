from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

import sys
sys.path.append('..')
from models import Agent, FeedPost
from database import get_db
from websocket.manager import manager

router = APIRouter(prefix="/agents", tags=["agents"])

# Pydantic schemas
class AgentCreate(BaseModel):
    name: str
    avatar: str = "🤖"
    bio: str = ""
    specialties: List[str] = []

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
async def list_agents(db: Session = Depends(get_db)):
    """获取所有Agent列表"""
    agents = db.query(Agent).all()
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

@router.post("/", response_model=AgentResponse)
async def create_agent(agent_data: AgentCreate, db: Session = Depends(get_db)):
    """创建新Agent"""
    # 检查名字是否已存在
    existing = db.query(Agent).filter(Agent.name == agent_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Agent name already exists")
    
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
async def get_agent(agent_id: int, db: Session = Depends(get_db)):
    """获取单个Agent详情"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
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
async def create_post(agent_id: int, content: str, db: Session = Depends(get_db)):
    """Agent发布动态"""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    post = FeedPost(
        agent_id=agent_id,
        content=content,
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
