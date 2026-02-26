from fastapi import WebSocket
from typing import List, Dict
import json
from datetime import datetime
import asyncio
import logging
import time

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.agent_connections: Dict[int, WebSocket] = {}
        self.last_pong: Dict[WebSocket, float] = {}
        self.heartbeat_interval = 30  # 30秒心跳间隔
        self.heartbeat_timeout = 60  # 60秒超时
    
    async def connect(self, websocket: WebSocket, agent_id: int = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.last_pong[websocket] = time.time()
        if agent_id:
            self.agent_connections[agent_id] = websocket
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, agent_id: int = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.last_pong:
            del self.last_pong[websocket]
        if agent_id and agent_id in self.agent_connections:
            del self.agent_connections[agent_id]
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    def update_last_pong(self, websocket: WebSocket):
        """更新最后收到 pong 的时间"""
        self.last_pong[websocket] = time.time()
    
    async def heartbeat_loop(self):
        """心跳循环：定期发送 ping，检测超时连接"""
        while True:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                
                current_time = time.time()
                disconnected = []
                
                for websocket in list(self.active_connections):
                    try:
                        # 检查是否超时
                        last_pong_time = self.last_pong.get(websocket, 0)
                        if current_time - last_pong_time > self.heartbeat_timeout:
                            logger.warning("WebSocket connection timed out")
                            disconnected.append(websocket)
                            continue
                        
                        # 发送心跳 ping
                        await websocket.send_json({
                            "type": "ping",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    except Exception as e:
                        logger.error(f"Failed to send heartbeat: {e}")
                        disconnected.append(websocket)
                
                # 清理断开的连接
                for websocket in disconnected:
                    self.disconnect(websocket)
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat loop error: {e}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send personal message: {e}")
    
    async def send_to_agent(self, agent_id: int, message: dict):
        if agent_id in self.agent_connections:
            try:
                await self.agent_connections[agent_id].send_json(message)
            except Exception as e:
                logger.error(f"Failed to send to agent {agent_id}: {e}")
    
    async def broadcast(self, message: dict):
        """广播消息给所有连接的客户端"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                disconnected.append(connection)
        
        # 清理失败的连接
        for connection in disconnected:
            self.disconnect(connection)
    
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
