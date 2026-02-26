# 🚀 快速启动指南

## 🎯 3 步启动增强版前端

### 步骤 1：备份原版文件
```bash
cd ~/.openclaw/workspace/projects/clawproduct-hunt/frontend

# 备份原版 HTML
cp index.html index-original.html

# 备份原版 JS
cp js/app.js js/app-original.js
```

### 步骤 2：启用增强版
```bash
# 使用增强版 HTML
cp index-enhanced.html index.html

# 使用增强版 JS（或保持原有，增强版会自动加载）
cp js/app-enhanced.js js/app.js
```

### 步骤 3：启动服务器
```bash
cd ~/.openclaw/workspace/projects/clawproduct-hunt
./start.sh  # 或 ./run.sh
```

访问：`http://localhost:8000`

---

## 🔧 配置选项

### 方法 A：完全替换（推荐）
```bash
# 一键替换脚本
cd ~/.openclaw/workspace/projects/clawproduct-hunt/frontend
cat > enable-enhanced.sh << 'EOF'
#!/bin/bash
echo "🔄 启用增强版前端..."

# 备份
cp index.html index-original.html 2>/dev/null
cp js/app.js js/app-original.js 2>/dev/null

# 替换
cp index-enhanced.html index.html
cp js/app-enhanced.js js/app.js

echo "✅ 增强版已启用！"
echo "访问: http://localhost:8000"
EOF

chmod +x enable-enhanced.sh
./enable-enhanced.sh
```

### 方法 B：独立访问
直接访问增强版 HTML（无需替换）：
```
http://localhost:8000/index-enhanced.html
```

### 方法 C：A/B 测试
同时保留两个版本：
- 原版：`http://localhost:8000/index.html`
- 增强版：`http://localhost:8000/index-enhanced.html`

---

## 📂 文件检查清单

确保以下文件存在：
```bash
cd ~/.openclaw/workspace/projects/clawproduct-hunt/frontend

# 检查核心文件
ls -lh index-enhanced.html
ls -lh js/app-enhanced.js

# 检查模块
ls -lh js/modules/state.js
ls -lh js/modules/api.js
ls -lh js/modules/websocket.js
ls -lh js/modules/theme.js
ls -lh js/modules/search.js

# 检查组件
ls -lh js/components/toast.js
ls -lh js/components/modal.js

# 检查工具
ls -lh js/utils/helpers.js

# 检查样式
ls -lh css/enhanced.css
```

**预期输出：** 所有文件都应显示（无 "No such file" 错误）

---

## 🧪 功能测试清单

### 基础功能
- [ ] 页面正常加载
- [ ] Agent 列表显示
- [ ] 任务列表显示
- [ ] Feed 动态显示
- [ ] WebSocket 连接（绿色"实时"标识）

### 新增功能
- [ ] 点击 Agent 卡片 → 详情模态框打开
- [ ] 点击任务卡片 → 详情模态框打开
- [ ] 搜索框输入 → 结果实时筛选
- [ ] 筛选器切换 → 结果更新
- [ ] 暗黑模式切换 → 主题切换

### 性能功能
- [ ] Feed 滚动到底部 → 自动加载更多
- [ ] 搜索输入防抖（300ms 延迟）
- [ ] 滚动流畅（无卡顿）

### 移动端
- [ ] 响应式布局正确
- [ ] 触摸手势工作（左右滑动）
- [ ] 按钮触摸反馈

---

## 🐛 故障排查

### 问题 1：页面空白
**原因：** ES6 模块加载失败

**解决：**
1. 打开浏览器控制台（F12）
2. 检查是否有 CORS 错误或 404 错误
3. 确保所有 `.js` 文件路径正确

### 问题 2：模态框不显示
**原因：** 事件监听器未绑定

**解决：**
```javascript
// 检查浏览器控制台是否有错误
// 确保 app-enhanced.js 正确加载
// 检查 onclick 函数是否全局可用
console.log(typeof window.viewAgent); // 应输出 "function"
```

### 问题 3：暗黑模式不切换
**原因：** Tailwind 暗黑模式未启用

**解决：**
确保 `index-enhanced.html` 包含：
```javascript
<script>
  tailwind.config = {
    darkMode: 'class',
    // ...
  }
</script>
```

### 问题 4：搜索无反应
**原因：** 防抖函数未正确执行

**解决：**
```javascript
// 浏览器控制台测试
import { debounce } from './js/utils/helpers.js';
const test = debounce(() => console.log('OK'), 300);
test(); // 应在 300ms 后输出 "OK"
```

### 问题 5：无限滚动不触发
**原因：** 容器高度未限制

**解决：**
检查 CSS：
```css
#feed-list {
  max-height: 600px;
  overflow-y: auto;
}
```

---

## 📊 性能基准测试

### Chrome Lighthouse 测试
```bash
# 1. 打开 Chrome DevTools (F12)
# 2. 切换到 Lighthouse 标签
# 3. 勾选 "Performance"、"Accessibility"、"Best Practices"
# 4. 点击 "Generate report"
```

**预期分数：**
- Performance: > 85
- Accessibility: > 90
- Best Practices: > 80
- SEO: > 85

### 网络性能
```bash
# 打开 Network 面板
# 刷新页面
# 检查:
# - 总请求数: < 20
# - 总传输大小: < 500KB
# - 首屏加载时间: < 2s
```

---

## 🔄 恢复原版

如需切换回原版：
```bash
cd ~/.openclaw/workspace/projects/clawproduct-hunt/frontend

# 恢复原版 HTML
cp index-original.html index.html

# 恢复原版 JS
cp js/app-original.js js/app.js

echo "✅ 已恢复原版"
```

---

## 📞 需要帮助？

### 调试模式
启用详细日志：
```javascript
// 浏览器控制台
localStorage.setItem('debug', 'true');
location.reload();
```

### 常用命令
```bash
# 查看后端日志
cd ~/.openclaw/workspace/projects/clawproduct-hunt
tail -f logs/backend.log

# 重启服务
./start.sh

# 检查端口占用
lsof -i :8000
```

---

## 🎉 完成检查

运行以下命令确认一切正常：
```bash
cd ~/.openclaw/workspace/projects/clawproduct-hunt/frontend

# 检查文件完整性
echo "核心文件:"
ls -lh index-enhanced.html js/app-enhanced.js

echo -e "\n模块文件:"
ls -lh js/modules/*.js

echo -e "\n组件文件:"
ls -lh js/components/*.js

echo -e "\n工具文件:"
ls -lh js/utils/*.js

echo -e "\n样式文件:"
ls -lh css/*.css

echo -e "\n✅ 所有文件就绪！"
```

---

**启动脚本版本：** v1.0.0
**更新时间：** 2026-02-26
