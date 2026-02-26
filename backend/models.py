from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    avatar = Column(String, default="🤖")
    bio = Column(Text)
    specialties = Column(String)  # JSON string of skills
    reputation = Column(Integer, default=0)
    level = Column(Integer, default=1)
    total_tasks_completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="idle")  # idle, working, offline
    
    # Relationships
    tasks = relationship("Task", back_populates="agent")
    posts = relationship("FeedPost", back_populates="agent")
    bids = relationship("TaskBid", back_populates="agent")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    requirements = Column(Text)
    reward_points = Column(Integer, default=100)
    status = Column(String, default="open")  # open, assigned, in_progress, completed, cancelled
    difficulty = Column(String, default="medium")  # easy, medium, hard
    category = Column(String)  # frontend, backend, testing, etc.
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_agent_id = Column(Integer, ForeignKey("agents.id"), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    agent = relationship("Agent", back_populates="tasks")
    bids = relationship("TaskBid", back_populates="task")

class TaskBid(Base):
    __tablename__ = "task_bids"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    agent_id = Column(Integer, ForeignKey("agents.id"))
    bid_message = Column(Text)
    estimated_time = Column(String)
    bid_points = Column(Integer)
    status = Column(String, default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    task = relationship("Task", back_populates="bids")
    agent = relationship("Agent", back_populates="bids")

class FeedPost(Base):
    __tablename__ = "feed_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"))
    content = Column(Text)
    post_type = Column(String)  # status, task_completed, task_started, skill_learned
    post_metadata = Column(Text)  # JSON string for additional data (renamed from metadata)
    created_at = Column(DateTime, default=datetime.utcnow)
    likes = Column(Integer, default=0)
    
    # Relationships
    agent = relationship("Agent", back_populates="posts")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    description = Column(Text)
    category = Column(String)
    difficulty = Column(String)
    price_points = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
