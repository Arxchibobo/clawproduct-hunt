"""
测试 Task API
"""
import pytest
from fastapi import status

def test_create_task(client, sample_task_data):
    """测试创建任务"""
    response = client.post("/api/tasks/", json=sample_task_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == sample_task_data["title"]
    assert data["description"] == sample_task_data["description"]
    assert data["reward_points"] == sample_task_data["reward_points"]
    assert data["status"] == "open"

def test_list_tasks(client, sample_task_data):
    """测试获取任务列表"""
    # 创建几个任务
    for i in range(3):
        data = sample_task_data.copy()
        data["title"] = f"Task {i}"
        client.post("/api/tasks/", json=data)
    
    # 获取列表
    response = client.get("/api/tasks/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 3

def test_get_task(client, sample_task_data):
    """测试获取单个任务"""
    # 创建任务
    create_response = client.post("/api/tasks/", json=sample_task_data)
    task_id = create_response.json()["id"]
    
    # 获取任务详情
    response = client.get(f"/api/tasks/{task_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == task_id
    assert data["title"] == sample_task_data["title"]

def test_assign_task(client, sample_agent_data, sample_task_data):
    """测试分配任务"""
    # 创建Agent和任务
    agent_response = client.post("/api/agents/", json=sample_agent_data)
    agent_id = agent_response.json()["id"]
    
    task_response = client.post("/api/tasks/", json=sample_task_data)
    task_id = task_response.json()["id"]
    
    # 分配任务
    response = client.post(f"/api/tasks/{task_id}/assign/{agent_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "success"

def test_complete_task(client, sample_agent_data, sample_task_data):
    """测试完成任务"""
    # 创建Agent和任务
    agent_response = client.post("/api/agents/", json=sample_agent_data)
    agent_id = agent_response.json()["id"]
    
    task_response = client.post("/api/tasks/", json=sample_task_data)
    task_id = task_response.json()["id"]
    
    # 分配任务
    client.post(f"/api/tasks/{task_id}/assign/{agent_id}")
    
    # 完成任务
    response = client.post(f"/api/tasks/{task_id}/complete")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "success"
    
    # 检查任务状态
    task_response = client.get(f"/api/tasks/{task_id}")
    assert task_response.json()["status"] == "completed"

def test_task_bid(client, sample_agent_data, sample_task_data):
    """测试任务竞标"""
    # 创建Agent和任务
    agent_response = client.post("/api/agents/", json=sample_agent_data)
    agent_id = agent_response.json()["id"]
    
    task_response = client.post("/api/tasks/", json=sample_task_data)
    task_id = task_response.json()["id"]
    
    # 竞标任务
    bid_data = {
        "bid_message": "I can do this!",
        "estimated_time": "2 hours",
        "bid_points": 80
    }
    response = client.post(f"/api/tasks/{task_id}/bid", json=bid_data, params={"agent_id": agent_id})
    assert response.status_code == status.HTTP_200_OK
