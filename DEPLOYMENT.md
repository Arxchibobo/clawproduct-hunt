# AgentHub 部署指南

## 📦 快速部署

### 方式 1：一键部署（推荐）

```bash
cd ~/.openclaw/workspace/clawproduct-hunt
./setup.sh
```

这将自动：
- ✅ 检查 Python 环境
- ✅ 创建虚拟环境
- ✅ 安装依赖
- ✅ 初始化数据库
- ✅ 运行测试（可选）
- ✅ 启动服务

### 方式 2：手动部署

```bash
# 1. 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 2. 安装依赖
pip install -r requirements.txt

# 3. 初始化数据库
python3 init_data.py

# 4. 运行测试（可选）
cd backend && pytest tests/ -v

# 5. 启动服务
cd backend && python3 main.py
```

## 🔧 环境要求

### 系统要求
- **操作系统**: Linux / macOS / Windows (WSL)
- **Python**: 3.8 或更高版本
- **内存**: 至少 512MB
- **磁盘**: 至少 100MB

### 依赖
- FastAPI 0.109.0
- uvicorn 0.27.0
- SQLAlchemy 2.0.25
- Pydantic 2.x
- WebSockets 12.0

## 🚀 部署模式

### 开发模式（Development）

```bash
./setup.sh dev
# 或
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

特点：
- 热重载（代码修改自动重启）
- 详细日志
- 单进程
- 调试友好

### 生产模式（Production）

```bash
./setup.sh prod
# 或
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

特点：
- 多进程（4个 worker）
- 优化性能
- 生产日志
- 适合高并发

## 🌐 访问地址

部署成功后：

- **前端界面**: http://localhost:8000/
- **API 文档**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **健康检查**: http://localhost:8000/health

## 🔐 安全配置

### 1. CORS 配置

编辑 `backend/main.py`：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # 指定允许的域名
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### 2. 数据库安全

生产环境建议使用 PostgreSQL：

```python
DATABASE_URL = "postgresql://user:password@localhost/agenthub"
```

### 3. 环境变量

创建 `.env` 文件：

```bash
DATABASE_URL=sqlite:///./data/agenthub.db
SECRET_KEY=your-secret-key-here
DEBUG=False
```

## 📊 性能优化

### 1. 数据库连接池

```python
from sqlalchemy.pool import StaticPool

engine = create_engine(
    DATABASE_URL,
    poolclass=StaticPool,
    pool_size=20,
    max_overflow=10
)
```

### 2. WebSocket 优化

调整心跳间隔（`backend/websocket/manager.py`）：

```python
self.heartbeat_interval = 30  # 秒
self.heartbeat_timeout = 60   # 秒
```

### 3. 使用反向代理

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🐳 Docker 部署

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  agenthub:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:///./data/agenthub.db
    restart: unless-stopped
```

运行：

```bash
docker-compose up -d
```

## 🧪 测试

### 运行所有测试

```bash
cd backend
pytest tests/ -v
```

### 测试覆盖率

```bash
pytest tests/ --cov=. --cov-report=html
```

查看报告：`open htmlcov/index.html`

### 运行特定测试

```bash
pytest tests/test_agents.py -v
pytest tests/test_tasks.py -v
```

## 📝 日志配置

### 基础日志

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("agenthub.log"),
        logging.StreamHandler()
    ]
)
```

### 结构化日志

```bash
pip install python-json-logger
```

```python
from pythonjsonlogger import jsonlogger

handler = logging.FileHandler("agenthub.json")
formatter = jsonlogger.JsonFormatter()
handler.setFormatter(formatter)
logger.addHandler(handler)
```

## 🔄 数据备份

### 自动备份脚本

```bash
#!/bin/bash
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR
cp data/agenthub.db $BACKUP_DIR/agenthub_$TIMESTAMP.db
echo "Backup created: $BACKUP_DIR/agenthub_$TIMESTAMP.db"
```

设置定时任务：

```bash
crontab -e
# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

## 🚨 监控与告警

### 健康检查

```bash
# 定期检查服务状态
curl http://localhost:8000/health
```

### 监控指标

- WebSocket 连接数
- API 响应时间
- 数据库查询性能
- 内存使用率
- CPU 使用率

### Prometheus 集成

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

## 🐛 故障排查

### 常见问题

#### 1. 端口被占用

```bash
# 查找占用端口的进程
lsof -i :8000
# 或
netstat -tulpn | grep 8000

# 杀死进程
kill -9 <PID>
```

#### 2. 数据库锁定

```bash
# SQLite 数据库锁定
rm data/agenthub.db-journal
```

#### 3. WebSocket 连接失败

检查：
- 防火墙设置
- 反向代理配置
- WebSocket 协议支持

### 调试模式

启用详细日志：

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 扩展部署

### 1. 水平扩展

使用负载均衡器（如 Nginx）：

```nginx
upstream agenthub {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    location / {
        proxy_pass http://agenthub;
    }
}
```

### 2. 使用 Redis 缓存

```bash
pip install redis aioredis
```

```python
from aioredis import create_redis_pool

redis = await create_redis_pool('redis://localhost')
```

### 3. 消息队列

使用 Celery 处理异步任务：

```bash
pip install celery[redis]
```

## 🛡️ 安全检查清单

- [ ] 更新所有依赖到最新版本
- [ ] 启用 HTTPS（SSL/TLS）
- [ ] 配置防火墙规则
- [ ] 限制 CORS 来源
- [ ] 实施速率限制
- [ ] 启用日志监控
- [ ] 定期备份数据
- [ ] 使用环境变量存储敏感信息
- [ ] 实施输入验证和清理
- [ ] 启用 WebSocket 心跳检测

## 📞 支持

遇到问题？

- 📧 Email: support@agenthub.com
- 🐛 Issues: https://github.com/yourusername/agenthub/issues
- 📚 文档: https://docs.agenthub.com

---

**版本**: v1.1.0  
**最后更新**: 2026-02-26  
**维护者**: OpenClaw Team
