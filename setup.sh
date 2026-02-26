#!/bin/bash

# AgentHub 自动部署脚本
# 使用方法: ./setup.sh [dev|prod]

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# 检查 Python 版本
check_python() {
    echo_info "Checking Python version..."
    
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        echo_error "Python is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
        echo_error "Python 3.8 or higher is required. Current version: $PYTHON_VERSION"
        exit 1
    fi
    
    echo_success "Python $PYTHON_VERSION found"
}

# 创建虚拟环境
setup_venv() {
    echo_info "Setting up virtual environment..."
    
    if [ ! -d "venv" ]; then
        $PYTHON_CMD -m venv venv
        echo_success "Virtual environment created"
    else
        echo_warning "Virtual environment already exists"
    fi
    
    # 激活虚拟环境
    if [ "$(detect_os)" == "windows" ]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    echo_success "Virtual environment activated"
}

# 安装依赖
install_dependencies() {
    echo_info "Installing dependencies..."
    
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # 安装测试依赖
    pip install pytest pytest-asyncio pytest-cov httpx
    
    echo_success "Dependencies installed"
}

# 初始化数据库
init_database() {
    echo_info "Initializing database..."
    
    # 创建 data 目录
    mkdir -p data
    
    # 运行初始化脚本（如果存在）
    if [ -f "init_data.py" ]; then
        $PYTHON_CMD init_data.py
        echo_success "Database initialized with sample data"
    else
        echo_warning "init_data.py not found, skipping sample data"
    fi
}

# 运行测试
run_tests() {
    echo_info "Running tests..."
    
    cd backend
    pytest tests/ -v --cov=. --cov-report=term-missing
    cd ..
    
    echo_success "Tests completed"
}

# 启动服务
start_service() {
    MODE=${1:-dev}
    
    echo_info "Starting AgentHub in $MODE mode..."
    
    cd backend
    
    if [ "$MODE" == "prod" ]; then
        # 生产模式：使用 uvicorn 和多进程
        uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --log-level info
    else
        # 开发模式：启用热重载
        uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug
    fi
}

# 主函数
main() {
    echo_info "================================================"
    echo_info "   AgentHub Deployment Script"
    echo_info "================================================"
    echo ""
    
    MODE=${1:-dev}
    
    # 检查依赖
    check_python
    
    # 设置环境
    setup_venv
    install_dependencies
    
    # 初始化数据库
    init_database
    
    # 运行测试（开发模式）
    if [ "$MODE" == "dev" ]; then
        read -p "Run tests? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            run_tests
        fi
    fi
    
    echo ""
    echo_success "Setup complete!"
    echo_info "================================================"
    echo_info "  🚀 Starting AgentHub..."
    echo_info "  📍 API Docs: http://localhost:8000/docs"
    echo_info "  🌐 Frontend: http://localhost:8000/"
    echo_info "================================================"
    echo ""
    
    # 启动服务
    start_service "$MODE"
}

# 执行主函数
main "$@"
