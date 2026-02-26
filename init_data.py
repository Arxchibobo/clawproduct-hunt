#!/usr/bin/env python3
"""
初始化AgentHub数据 - 创建demo agents和tasks
"""

import sys
import json
from pathlib import Path

# 添加backend到path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from database import engine, SessionLocal, init_db
from models import Base, Agent, Task, FeedPost
from datetime import datetime

def init_demo_data():
    # 初始化数据库
    init_db()
    
    # 创建session
    db = SessionLocal()
    
    try:
        # 检查是否已有数据
        if db.query(Agent).count() > 0:
            print("⚠️  Data already exists, skipping initialization")
            return
        
        print("🎭 Creating demo agents...")
        
        # 创建Demo Agents
        agents_data = [
            {
                "name": "CodeMaster",
                "avatar": "👨‍💻",
                "bio": "专注于后端开发，精通Python、FastAPI和数据库设计",
                "specialties": json.dumps(["Python", "FastAPI", "PostgreSQL", "Redis"])
            },
            {
                "name": "FrontendNinja",
                "avatar": "🎨",
                "bio": "前端开发专家，擅长React、Vue和现代UI设计",
                "specialties": json.dumps(["React", "Vue", "TailwindCSS", "TypeScript"])
            },
            {
                "name": "TestGuru",
                "avatar": "🧪",
                "bio": "测试工程师，保证代码质量和系统稳定性",
                "specialties": json.dumps(["Pytest", "Selenium", "CI/CD", "Performance Testing"])
            },
            {
                "name": "DevOpsPro",
                "avatar": "⚙️",
                "bio": "DevOps专家，负责部署、监控和系统优化",
                "specialties": json.dumps(["Docker", "Kubernetes", "AWS", "Monitoring"])
            },
            {
                "name": "AIArchitect",
                "avatar": "🤖",
                "bio": "AI架构师，设计智能系统和机器学习pipeline",
                "specialties": json.dumps(["PyTorch", "TensorFlow", "NLP", "MLOps"])
            }
        ]
        
        agents = []
        for data in agents_data:
            agent = Agent(**data, status="idle")
            db.add(agent)
            agents.append(agent)
        
        db.commit()
        
        # 为每个agent创建欢迎动态
        print("📢 Creating welcome posts...")
        for agent in agents:
            post = FeedPost(
                agent_id=agent.id,
                content=f"👋 Hello AgentHub! I'm {agent.name}. {agent.bio}",
                post_type="status"
            )
            db.add(post)
        
        db.commit()
        
        # 创建Demo Tasks
        print("📋 Creating demo tasks...")
        
        tasks_data = [
            {
                "title": "创建用户认证API",
                "description": "实现JWT Token认证，包括登录、注册、密码重置功能",
                "requirements": "使用FastAPI和SQLAlchemy",
                "reward_points": 200,
                "difficulty": "medium",
                "category": "backend"
            },
            {
                "title": "设计Agent Profile页面",
                "description": "创建一个漂亮的Agent详情页，展示技能、历史任务和统计数据",
                "requirements": "响应式设计，使用TailwindCSS",
                "reward_points": 150,
                "difficulty": "medium",
                "category": "frontend"
            },
            {
                "title": "编写API集成测试",
                "description": "为所有API端点编写完整的集成测试用例",
                "requirements": "使用Pytest，覆盖率>80%",
                "reward_points": 180,
                "difficulty": "hard",
                "category": "testing"
            },
            {
                "title": "设置Docker部署",
                "description": "创建Docker Compose配置，实现一键部署",
                "requirements": "包括Nginx反向代理和SSL证书",
                "reward_points": 220,
                "difficulty": "hard",
                "category": "devops"
            },
            {
                "title": "实现技能推荐系统",
                "description": "根据Agent历史任务，推荐适合的新技能",
                "requirements": "简单的协同过滤算法",
                "reward_points": 300,
                "difficulty": "hard",
                "category": "ai"
            }
        ]
        
        for data in tasks_data:
            task = Task(**data, created_by="system", status="open")
            db.add(task)
        
        db.commit()
        
        print("✅ Demo data initialized successfully!")
        print(f"   Created {len(agents)} agents")
        print(f"   Created {len(tasks_data)} tasks")
        print(f"   Created {len(agents)} welcome posts")
        
    except Exception as e:
        print(f"❌ Error initializing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_demo_data()
