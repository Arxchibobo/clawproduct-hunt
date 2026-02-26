from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

import sys
sys.path.append('..')
from models import Task, Agent, TaskBid, FeedPost
from database import get_db
from websocket.manager import manager

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Pydantic schemas
class TaskCreate(BaseModel):
    title: str
    description: str
    requirements: str = ""
    reward_points: int = 100
    difficulty: str = "medium"
    category: str = "general"
    created_by: str = "user"

class TaskBidCreate(BaseModel):
    agent_id: int
    bid_message: str
    estimated_time: str
    bid_points: int

class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    requirements: str
    reward_points: int
    status: str
    difficulty: str
    category: str
    created_by: str
    created_at: datetime
    assigned_agent: Optional[dict] = None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[TaskResponse])
async def list_tasks(status: Optional[str] = None, db: Session = Depends(get_db)):
    """获取任务列表"""
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    tasks = query.order_by(Task.created_at.desc()).all()
    
    result = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "requirements": task.requirements or "",
            "reward_points": task.reward_points,
            "status": task.status,
            "difficulty": task.difficulty,
            "category": task.category,
            "created_by": task.created_by,
            "created_at": task.created_at,
            "assigned_agent": None
        }
        
        if task.assigned_agent_id:
            agent = db.query(Agent).filter(Agent.id == task.assigned_agent_id).first()
            if agent:
                task_dict["assigned_agent"] = {
                    "id": agent.id,
                    "name": agent.name,
                    "avatar": agent.avatar
                }
        
        result.append(task_dict)
    return result

@router.post("/", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    """创建新任务"""
    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        requirements=task_data.requirements,
        reward_points=task_data.reward_points,
        difficulty=task_data.difficulty,
        category=task_data.category,
        created_by=task_data.created_by,
        status="open"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    
    # 广播新任务
    await manager.broadcast_task_update({
        "event": "task_created",
        "task": {
            "id": new_task.id,
            "title": new_task.title,
            "reward_points": new_task.reward_points,
            "difficulty": new_task.difficulty,
            "category": new_task.category
        }
    })
    
    return {
        "id": new_task.id,
        "title": new_task.title,
        "description": new_task.description,
        "requirements": new_task.requirements or "",
        "reward_points": new_task.reward_points,
        "status": new_task.status,
        "difficulty": new_task.difficulty,
        "category": new_task.category,
        "created_by": new_task.created_by,
        "created_at": new_task.created_at,
        "assigned_agent": None
    }

@router.post("/{task_id}/bid")
async def bid_on_task(task_id: int, bid_data: TaskBidCreate, db: Session = Depends(get_db)):
    """Agent对任务进行竞标"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status != "open":
        raise HTTPException(status_code=400, detail="Task is not open for bidding")
    
    agent = db.query(Agent).filter(Agent.id == bid_data.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # 创建竞标
    bid = TaskBid(
        task_id=task_id,
        agent_id=bid_data.agent_id,
        bid_message=bid_data.bid_message,
        estimated_time=bid_data.estimated_time,
        bid_points=bid_data.bid_points
    )
    db.add(bid)
    db.commit()
    
    # 发布动态
    post = FeedPost(
        agent_id=agent.id,
        content=f"💼 I'm interested in task: {task.title}! {bid_data.bid_message}",
        post_type="task_bid",
        post_metadata=json.dumps({"task_id": task_id})
    )
    db.add(post)
    db.commit()
    
    # 广播竞标
    await manager.broadcast_feed_post({
        "id": post.id,
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "avatar": agent.avatar
        },
        "content": post.content,
        "post_type": post.post_type,
        "created_at": post.created_at.isoformat()
    })
    
    return {"status": "success", "bid_id": bid.id}

@router.post("/{task_id}/assign/{agent_id}")
async def assign_task(task_id: int, agent_id: int, db: Session = Depends(get_db)):
    """将任务分配给Agent"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # 分配任务
    task.assigned_agent_id = agent_id
    task.status = "assigned"
    agent.status = "working"
    db.commit()
    
    # 发布动态
    post = FeedPost(
        agent_id=agent.id,
        content=f"🚀 Starting task: {task.title}",
        post_type="task_started",
        post_metadata=json.dumps({"task_id": task_id})
    )
    db.add(post)
    db.commit()
    
    # 广播更新
    await manager.broadcast_task_update({
        "event": "task_assigned",
        "task_id": task_id,
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "avatar": agent.avatar
        }
    })
    
    await manager.broadcast_feed_post({
        "id": post.id,
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "avatar": agent.avatar
        },
        "content": post.content,
        "post_type": post.post_type,
        "created_at": post.created_at.isoformat()
    })
    
    return {"status": "success"}

@router.post("/{task_id}/complete")
async def complete_task(task_id: int, db: Session = Depends(get_db)):
    """完成任务"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if not task.assigned_agent_id:
        raise HTTPException(status_code=400, detail="Task not assigned")
    
    agent = db.query(Agent).filter(Agent.id == task.assigned_agent_id).first()
    
    # 完成任务
    task.status = "completed"
    task.completed_at = datetime.utcnow()
    agent.status = "idle"
    agent.reputation += task.reward_points
    agent.total_tasks_completed += 1
    
    # 升级判断
    if agent.total_tasks_completed % 5 == 0:
        agent.level += 1
    
    db.commit()
    
    # 发布动态
    post = FeedPost(
        agent_id=agent.id,
        content=f"✅ Completed task: {task.title}! Earned {task.reward_points} points 🎉",
        post_type="task_completed",
        post_metadata=json.dumps({"task_id": task_id, "reward": task.reward_points})
    )
    db.add(post)
    db.commit()
    
    # 广播更新
    await manager.broadcast_task_update({
        "event": "task_completed",
        "task_id": task_id,
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "reputation": agent.reputation,
            "level": agent.level
        }
    })
    
    await manager.broadcast_feed_post({
        "id": post.id,
        "agent": {
            "id": agent.id,
            "name": agent.name,
            "avatar": agent.avatar
        },
        "content": post.content,
        "post_type": post.post_type,
        "created_at": post.created_at.isoformat()
    })
    
    return {"status": "success", "reward": task.reward_points}
