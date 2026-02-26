"""
测试 Agent API
"""
import pytest
from fastapi import status

def test_create_agent(client, sample_agent_data):
    """测试创建Agent"""
    response = client.post("/api/agents/", json=sample_agent_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == sample_agent_data["name"]
    assert data["avatar"] == sample_agent_data["avatar"]
    assert data["bio"] == sample_agent_data["bio"]
    assert data["specialties"] == sample_agent_data["specialties"]
    assert data["reputation"] == 0
    assert data["level"] == 1

def test_create_agent_duplicate_name(client, sample_agent_data):
    """测试创建重名Agent（应该失败）"""
    # 创建第一个Agent
    client.post("/api/agents/", json=sample_agent_data)
    
    # 尝试创建同名Agent
    response = client.post("/api/agents/", json=sample_agent_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"]

def test_create_agent_invalid_name(client, sample_agent_data):
    """测试无效Agent名称"""
    invalid_data = sample_agent_data.copy()
    invalid_data["name"] = "Invalid Name!"  # 包含空格和特殊字符
    
    response = client.post("/api/agents/", json=invalid_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_create_agent_name_too_short(client, sample_agent_data):
    """测试名称过短"""
    invalid_data = sample_agent_data.copy()
    invalid_data["name"] = "ab"  # 少于3个字符
    
    response = client.post("/api/agents/", json=invalid_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_create_agent_name_too_long(client, sample_agent_data):
    """测试名称过长"""
    invalid_data = sample_agent_data.copy()
    invalid_data["name"] = "a" * 51  # 超过50个字符
    
    response = client.post("/api/agents/", json=invalid_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_list_agents(client, sample_agent_data):
    """测试获取Agent列表"""
    # 创建几个Agents
    for i in range(3):
        data = sample_agent_data.copy()
        data["name"] = f"Agent{i}"
        client.post("/api/agents/", json=data)
    
    # 获取列表
    response = client.get("/api/agents/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 3

def test_list_agents_with_pagination(client, sample_agent_data):
    """测试分页获取Agent列表"""
    # 创建5个Agents
    for i in range(5):
        data = sample_agent_data.copy()
        data["name"] = f"Agent{i}"
        client.post("/api/agents/", json=data)
    
    # 获取前2个
    response = client.get("/api/agents/?skip=0&limit=2")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    
    # 获取接下来2个
    response = client.get("/api/agents/?skip=2&limit=2")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2

def test_get_agent(client, sample_agent_data):
    """测试获取单个Agent"""
    # 创建Agent
    create_response = client.post("/api/agents/", json=sample_agent_data)
    agent_id = create_response.json()["id"]
    
    # 获取Agent详情
    response = client.get(f"/api/agents/{agent_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == agent_id
    assert data["name"] == sample_agent_data["name"]

def test_get_agent_not_found(client):
    """测试获取不存在的Agent"""
    response = client.get("/api/agents/999")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_agent_post(client, sample_agent_data):
    """测试Agent发布动态"""
    # 创建Agent
    create_response = client.post("/api/agents/", json=sample_agent_data)
    agent_id = create_response.json()["id"]
    
    # 发布动态
    post_content = {"content": "Hello, World!"}
    response = client.post(f"/api/agents/{agent_id}/post", json=post_content)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "success"
    assert "post_id" in data

def test_agent_post_too_long(client, sample_agent_data):
    """测试发布过长的动态"""
    # 创建Agent
    create_response = client.post("/api/agents/", json=sample_agent_data)
    agent_id = create_response.json()["id"]
    
    # 发布过长动态（超过2000字符）
    post_content = {"content": "x" * 2001}
    response = client.post(f"/api/agents/{agent_id}/post", json=post_content)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_health_check(client):
    """测试健康检查端点"""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "AgentHub"
    assert "version" in data
    assert "websocket_connections" in data
