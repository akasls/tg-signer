# 快速参考指南

## 🚀 快速开始

### 本地测试

#### Windows
```cmd
local-test.bat
```

#### Linux/Mac
```bash
chmod +x local-test.sh
./local-test.sh
```

#### 手动运行
```bash
# 构建
docker build -t tg-signer .

# 运行
docker run -p 3000:3000 \
  -e APP_SECRET_KEY=your-secret-key \
  -v ./data:/data \
  tg-signer

# 测试
python test_api.py
```

### Zeabur 部署

1. **推送代码到 Git**
   ```bash
   git add .
   git commit -m "修复容器崩溃问题"
   git push
   ```

2. **在 Zeabur 控制台**
   - 创建新服务
   - 连接 Git 仓库
   - 设置环境变量: `APP_SECRET_KEY=<随机字符串>`
   - 添加持久化存储: 挂载到 `/data`
   - 部署

3. **验证部署**
   - 访问应用 URL
   - 使用 `admin/admin123` 登录
   - 立即修改密码！

## 📝 重要配置

### 环境变量

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `APP_SECRET_KEY` | ✅ | - | JWT 密钥（必须设置！） |
| `APP_ACCESS_TOKEN_EXPIRE_HOURS` | ❌ | 12 | Token 过期时间（小时） |
| `APP_DATA_DIR` | ❌ | /data | 数据目录 |
| `PORT` | ❌ | 3000 | 服务端口 |

### 生成安全密钥

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -base64 32
```

## 🔧 常用命令

### Docker

```bash
# 查看日志
docker logs -f tg-signer-test-container

# 进入容器
docker exec -it tg-signer-test-container /bin/bash

# 停止容器
docker stop tg-signer-test-container

# 删除容器
docker rm tg-signer-test-container

# 查看容器状态
docker ps -a | grep tg-signer
```

### 数据管理

```bash
# 备份数据
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# 恢复数据
tar -xzf backup-20241224.tar.gz

# 查看数据库
sqlite3 data/db.sqlite ".tables"
```

## 🌐 API 端点

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 账号管理
- `GET /api/accounts` - 列出账号
- `POST /api/accounts` - 创建账号
- `POST /api/accounts/{id}/login/start` - 开始登录
- `POST /api/accounts/{id}/login/verify` - 验证登录

### 任务管理
- `GET /api/tasks` - 列出任务
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/{id}` - 更新任务
- `DELETE /api/tasks/{id}` - 删除任务
- `POST /api/tasks/{id}/run` - 运行任务
- `GET /api/tasks/{id}/logs` - 获取日志

### 健康检查
- `GET /health` - 健康检查

## 🐛 故障排查

### 容器无法启动

```bash
# 查看日志
docker logs tg-signer-test-container

# 检查环境变量
docker inspect tg-signer-test-container | grep -A 20 Env

# 检查挂载
docker inspect tg-signer-test-container | grep -A 10 Mounts
```

### API 请求失败

1. **检查路径**: 确保使用 `/api` 前缀
2. **检查 token**: 确保请求包含有效的 Bearer token
3. **查看日志**: `docker logs -f tg-signer-test-container`

### 前端无法加载

1. **检查构建**: 确保 `frontend/out` 目录存在
2. **检查挂载**: 确保静态文件正确复制到 `/web`
3. **清除缓存**: 强制刷新浏览器 (Ctrl+Shift+R)

### 数据库问题

```bash
# 进入容器
docker exec -it tg-signer-test-container /bin/bash

# 检查数据库文件
ls -la /data/db.sqlite

# 检查权限
ls -la /data/

# 手动创建数据库（如果需要）
python -c "from backend.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

## 📊 监控

### 健康检查

```bash
# 简单检查
curl http://localhost:3000/health

# 持续监控
watch -n 5 'curl -s http://localhost:3000/health'
```

### 资源使用

```bash
# 查看容器资源使用
docker stats tg-signer-test-container

# 查看容器详情
docker inspect tg-signer-test-container
```

## 🔒 安全建议

1. **立即修改默认密码**
2. **使用强随机密钥** (`APP_SECRET_KEY`)
3. **启用 HTTPS** (Zeabur 自动提供)
4. **定期更新依赖**
5. **定期备份数据**
6. **限制访问** (如果可能)

## 📚 相关文档

- [修复总结](FIX_SUMMARY.md) - 详细的问题分析和修复说明
- [Zeabur 部署指南](ZEABUR_DEPLOY.md) - Zeabur 部署详细步骤
- [项目 README](README.md) - 项目介绍和使用说明
- [测试脚本](test_api.py) - API 测试脚本

## 💡 提示

- 默认管理员账号: `admin` / `admin123`
- 数据存储在 `/data` 目录
- 日志存储在 `/data/logs` 目录
- 会话文件存储在 `/data/sessions` 目录
- 数据库文件: `/data/db.sqlite`

## 🆘 获取帮助

如果遇到问题：

1. 查看 [修复总结](FIX_SUMMARY.md)
2. 查看 [Zeabur 部署指南](ZEABUR_DEPLOY.md)
3. 运行 `python test_api.py` 进行诊断
4. 查看容器日志: `docker logs -f <container_name>`
5. 检查 GitHub Issues

---

**最后更新**: 2024-12-24
