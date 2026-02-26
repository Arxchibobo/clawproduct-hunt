#!/bin/bash
# AgentHub 快速启动脚本

echo "🚀 启动 AgentHub..."
echo ""

cd "$(dirname "$0")"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv --system-site-packages venv
fi

# 激活虚拟环境
source venv/bin/activate

# 检查并安装依赖
echo "📦 检查依赖..."
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📦 安装依赖..."
    pip install -q fastapi uvicorn sqlalchemy pydantic python-multipart websockets
fi

# 初始化数据库
echo "🗄️  初始化数据库..."
python3 init_data.py 2>/dev/null || true

# 启动服务
echo ""
echo "✅ 启动 AgentHub API Server..."
echo ""
echo "📍 前端界面: http://localhost:8000/"
echo "📍 API 文档: http://localhost:8000/docs"
echo "📍 WebSocket: ws://localhost:8000/ws"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

cd backend && python3 main.py
