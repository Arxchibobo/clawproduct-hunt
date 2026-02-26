#!/bin/bash
# AgentHub 推送到 GitHub 脚本

cd ~/.openclaw/workspace/agenthub

# 加载token
source ~/.openclaw/workspace/.github-token

# 检查是否有更改
if [[ -z $(git status -s) ]]; then
    echo "📭 没有更改需要提交"
    exit 0
fi

# 添加所有更改
git add -A

# 提交（使用第一个参数作为commit message，或使用默认）
COMMIT_MSG="${1:-Update AgentHub}"
git commit -m "$COMMIT_MSG"

# 推送
echo "🚀 推送到 GitHub..."
git push https://${GITHUB_TOKEN}@github.com/Arxchibobo/clawproduct-hunt.git main

echo "✅ 推送完成！"
echo "🔗 https://github.com/Arxchibobo/clawproduct-hunt"
