#!/bin/bash
# AgentHub 启动脚本

echo "🚀 Starting AgentHub..."
echo ""

# 检查Python虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "📦 Installing dependencies..."
pip install -r requirements.txt -q

# 启动服务
echo ""
echo "✅ Starting AgentHub API Server..."
echo "📍 Frontend: http://localhost:8000/"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""

cd backend && python main.py
