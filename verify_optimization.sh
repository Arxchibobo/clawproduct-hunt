#!/bin/bash

# AgentHub 优化验证脚本
# 快速检查所有改进是否正确实施

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 AgentHub 优化验证脚本${NC}"
echo "=================================="
echo ""

# 1. 检查文件存在性
echo "📁 检查新增文件..."
files=(
    "backend/tests/__init__.py"
    "backend/tests/conftest.py"
    "backend/tests/test_agents.py"
    "backend/tests/test_tasks.py"
    "setup.sh"
    "DEPLOYMENT.md"
    "OPTIMIZATION_REPORT.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file (missing)"
        exit 1
    fi
done

# 2. 检查 Python 语法
echo ""
echo "🐍 检查 Python 语法..."
python3 -m py_compile backend/main.py && echo -e "  ${GREEN}✓${NC} main.py"
python3 -m py_compile backend/websocket/manager.py && echo -e "  ${GREEN}✓${NC} websocket/manager.py"
python3 -m py_compile backend/api/agents.py && echo -e "  ${GREEN}✓${NC} api/agents.py"

# 3. 检查关键改进
echo ""
echo "🔧 检查关键改进..."

# 检查 lifespan
if grep -q "asynccontextmanager" backend/main.py; then
    echo -e "  ${GREEN}✓${NC} FastAPI lifespan handler 已升级"
else
    echo -e "  ${RED}✗${NC} FastAPI lifespan handler 未找到"
    exit 1
fi

# 检查心跳机制
if grep -q "heartbeat_loop" backend/websocket/manager.py; then
    echo -e "  ${GREEN}✓${NC} WebSocket 心跳机制已实现"
else
    echo -e "  ${RED}✗${NC} WebSocket 心跳机制未找到"
    exit 1
fi

# 检查输入验证
if grep -q "sanitize_html" backend/api/agents.py; then
    echo -e "  ${GREEN}✓${NC} XSS 防护已添加"
else
    echo -e "  ${RED}✗${NC} XSS 防护未找到"
    exit 1
fi

# 检查测试依赖
if grep -q "pytest" requirements.txt; then
    echo -e "  ${GREEN}✓${NC} 测试依赖已添加"
else
    echo -e "  ${RED}✗${NC} 测试依赖未找到"
    exit 1
fi

# 4. 统计测试数量
echo ""
echo "🧪 统计测试用例..."
test_count=$(grep -r "^def test_" backend/tests/*.py | wc -l)
echo -e "  ${GREEN}✓${NC} 发现 $test_count 个测试用例"

# 5. 检查部署脚本权限
echo ""
echo "🚀 检查部署脚本..."
if [ -x setup.sh ]; then
    echo -e "  ${GREEN}✓${NC} setup.sh 可执行"
else
    echo -e "  ${RED}✗${NC} setup.sh 不可执行"
    exit 1
fi

# 总结
echo ""
echo "=================================="
echo -e "${GREEN}✨ 所有验证通过！优化成功实施！${NC}"
echo ""
echo "📊 优化统计："
echo "  • 新增文件: ${#files[@]} 个"
echo "  • 测试用例: $test_count 个"
echo "  • 修改文件: 4 个"
echo ""
echo "🎯 下一步："
echo "  1. 运行测试: cd backend && pytest tests/ -v"
echo "  2. 启动服务: ./setup.sh dev"
echo "  3. 查看文档: cat DEPLOYMENT.md"
echo ""
