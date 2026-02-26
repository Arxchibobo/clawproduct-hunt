#!/bin/bash
echo "🔄 启用 AgentHub 增强版前端..."

cd frontend

# 检查文件
if [ ! -f "index-enhanced.html" ]; then
    echo "❌ 错误: index-enhanced.html 不存在"
    exit 1
fi

if [ ! -f "js/app-enhanced.js" ]; then
    echo "❌ 错误: js/app-enhanced.js 不存在"
    exit 1
fi

# 备份原版
echo "📦 备份原版文件..."
cp index.html index-original.html 2>/dev/null || true
cp js/app.js js/app-original.js 2>/dev/null || true

# 启用增强版
echo "🚀 启用增强版..."
cp index-enhanced.html index.html
cp js/app-enhanced.js js/app.js

echo ""
echo "✅ 增强版已启用！"
echo ""
echo "📂 文件检查:"
ls -lh index.html js/app.js js/modules/*.js js/components/*.js js/utils/*.js css/*.css 2>/dev/null | grep -v "^total"
echo ""
echo "🌐 访问地址: http://localhost:8000"
echo "📚 文档: ../FRONTEND_ENHANCEMENT.md"
echo ""
echo "💡 恢复原版: cp index-original.html index.html && cp js/app-original.js js/app.js"
