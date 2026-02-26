from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from database import init_db
from websocket.manager import manager

# 导入API路由
from api import agents, tasks, feed

# 创建FastAPI应用
app = FastAPI(
    title="AgentHub",
    description="AI Agent Social Platform & Skill Marketplace",
    version="1.0.0"
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

# WebSocket端点
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # 保持连接
            data = await websocket.receive_text()
            # 可以处理客户端发送的消息
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# 根路径 - 返回前端页面
@app.get("/")
async def root():
    from fastapi.responses import FileResponse
    return FileResponse(str(FRONTEND_DIR / "index.html"))

# 健康检查
@app.get("/health")
async def health():
    return {"status": "ok", "service": "AgentHub"}

# 启动事件
@app.on_event("startup")
async def startup_event():
    init_db()
    print("🚀 AgentHub API Server Started!")
    print("📍 API Docs: http://localhost:8000/docs")
    print("🌐 Frontend: http://localhost:8000/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
