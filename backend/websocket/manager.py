from fastapi import WebSocket
from typing import List, Dict
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.agent_connections: Dict[int, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, agent_id: int = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if agent_id:
            self.agent_connections[agent_id] = websocket
    
    def disconnect(self, websocket: WebSocket, agent_id: int = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if agent_id and agent_id in self.agent_connections:
            del self.agent_connections[agent_id]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)
    
    async def send_to_agent(self, agent_id: int, message: dict):
        if agent_id in self.agent_connections:
            await self.agent_connections[agent_id].send_json(message)
    
    async def broadcast(self, message: dict):
        """广播消息给所有连接的客户端"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass
    
    async def broadcast_feed_post(self, post_data: dict):
        """广播新的Feed动态"""
        message = {
            "type": "feed_post",
            "data": post_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)
    
    async def broadcast_task_update(self, task_data: dict):
        """广播任务更新"""
        message = {
            "type": "task_update",
            "data": task_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)
    
    async def broadcast_agent_status(self, agent_data: dict):
        """广播Agent状态更新"""
        message = {
            "type": "agent_status",
            "data": agent_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)

manager = ConnectionManager()
