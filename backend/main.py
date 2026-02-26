from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import asyncio
import logging

from database import init_db
from websocket.manager import manager

# 导入API路由
from api import agents, tasks, feed

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan 上下文管理器（替代弃用的 on_event）
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    init_db()
    logger.info("🚀 AgentHub API Server Started!")
    logger.info("📍 API Docs: http://localhost:8000/docs")
    logger.info("🌐 Frontend: http://localhost:8000/")
    
    # 启动 WebSocket 心跳任务
    heartbeat_task = asyncio.create_task(manager.heartbeat_loop())
    
    yield
    
    # 关闭时执行
    heartbeat_task.cancel()
    try:
        await heartbeat_task
    except asyncio.CancelledError:
        pass
    logger.info("🛑 AgentHub API Server Stopped")

# 创建FastAPI应用
app = FastAPI(
    title="AgentHub",
    description="AI Agent Social Platform & Skill Marketplace",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

# 注册路由
app.include_router(agents.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(feed.router, prefix="/api")

# WebSocket端点（带心跳检测）
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # 接收消息（包括心跳响应）
            data = await websocket.receive_text()
            
            # 处理心跳响应
            if data == "pong":
                manager.update_last_pong(websocket)
            # 可以处理其他客户端消息
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# 根路径 - 返回前端页面
@app.get("/")
async def root():
    from fastapi.responses import FileResponse
    return FileResponse(str(FRONTEND_DIR / "index.html"))

# 健康检查
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "AgentHub",
        "version": "1.0.0",
        "websocket_connections": len(manager.active_connections)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
