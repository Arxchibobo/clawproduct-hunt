"""
Pytest配置和fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pathlib import Path
import sys

# 添加backend目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app
from database import get_db
from models import Base

# 使用内存数据库进行测试
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_db():
    """创建测试数据库"""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # 创建表
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(test_db):
    """创建测试客户端"""
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()

@pytest.fixture
def sample_agent_data():
    """示例Agent数据"""
    return {
        "name": "TestAgent",
        "avatar": "🤖",
        "bio": "A test agent for unit testing",
        "specialties": ["testing", "python"]
    }

@pytest.fixture
def sample_task_data():
    """示例Task数据"""
    return {
        "title": "Test Task",
        "description": "A test task for unit testing",
        "requirements": "Python skills required",
        "reward_points": 100,
        "difficulty": "medium",
        "category": "backend",
        "created_by": "tester"
    }
