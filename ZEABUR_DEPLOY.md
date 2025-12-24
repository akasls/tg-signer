# Zeabur 部署指南

## 修复的问题

本次修复解决了以下导致容器崩溃的问题：

### 1. **API 路由冲突问题**
- **问题**: 静态文件挂载在根路径 `/`，覆盖了所有 API 路由
- **修复**: 将所有 API 路由添加 `/api` 前缀，并确保在静态文件挂载之前注册
- **影响文件**:
  - `backend/main.py`: 添加 API 路由前缀
  - `frontend/lib/api.ts`: 更新 API 基础路径

### 2. **Pydantic 版本兼容性问题**
- **问题**: `BaseSettings` 导入方式在不同 Pydantic 版本中不兼容
- **修复**: 添加兼容性导入，支持 Pydantic v1 和 v2
- **影响文件**: `backend/core/config.py`

### 3. **依赖包缺失问题**
- **问题**: 缺少必要的 Python 包（如 `python-multipart`）
- **修复**: 在 Dockerfile 中添加所有必要的依赖包
- **影响文件**: `Dockerfile`

### 4. **构建优化**
- **问题**: Docker 构建效率低，缓存利用不足
- **修复**: 
  - 优化 Dockerfile 层级结构
  - 添加 `.dockerignore` 文件
  - 添加健康检查
- **影响文件**: `Dockerfile`, `.dockerignore`

## Zeabur 部署步骤

### 1. 环境变量配置

在 Zeabur 控制台中设置以下环境变量：

```bash
# 必须设置（安全密钥）
APP_SECRET_KEY=your-very-secure-random-secret-key-here

# 可选配置
APP_ACCESS_TOKEN_EXPIRE_HOURS=12
APP_DATA_DIR=/data
```

**重要**: 请将 `APP_SECRET_KEY` 设置为一个强随机字符串，可以使用以下命令生成：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. 持久化存储

在 Zeabur 中添加持久化存储卷：

- **挂载路径**: `/data`
- **用途**: 存储数据库、会话文件、日志等

### 3. 端口配置

- **容器端口**: 3000
- Zeabur 会自动设置 `PORT` 环境变量，应用会自动使用

### 4. 健康检查

应用已配置健康检查端点：

- **路径**: `/health`
- **间隔**: 30秒
- **超时**: 10秒
- **启动等待**: 40秒

### 5. 默认管理员账号

首次启动时，系统会自动创建默认管理员账号：

- **用户名**: `admin`
- **密码**: `admin123`

**重要**: 首次登录后请立即修改密码！

## API 端点

所有 API 端点都在 `/api` 前缀下：

- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `GET /api/accounts` - 获取账号列表
- `POST /api/accounts` - 创建账号
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/{id}` - 更新任务
- `DELETE /api/tasks/{id}` - 删除任务
- `POST /api/tasks/{id}/run` - 运行任务
- `GET /api/tasks/{id}/logs` - 获取任务日志

## 前端访问

- **主页**: `https://your-app.zeabur.app/`
- **登录页**: `https://your-app.zeabur.app/`
- **控制台**: `https://your-app.zeabur.app/dashboard`

## 故障排查

### 容器启动失败

1. **检查日志**: 在 Zeabur 控制台查看容器日志
2. **检查环境变量**: 确保 `APP_SECRET_KEY` 已设置
3. **检查持久化存储**: 确保 `/data` 目录已正确挂载

### API 请求失败

1. **检查路径**: 确保 API 请求使用 `/api` 前缀
2. **检查 CORS**: 应用已配置允许所有来源，但可以根据需要调整
3. **检查认证**: 确保请求包含有效的 Bearer token

### 数据库问题

1. **位置**: 数据库文件位于 `/data/db.sqlite`
2. **权限**: 确保容器有写入权限
3. **备份**: 定期备份 `/data` 目录

## 本地测试

在部署到 Zeabur 之前，可以本地测试：

```bash
# 构建镜像
docker build -t tg-signer .

# 运行容器
docker run -p 3000:3000 \
  -e APP_SECRET_KEY=test-secret-key \
  -v $(pwd)/data:/data \
  tg-signer

# 访问应用
open http://localhost:3000
```

## 性能优化建议

1. **使用持久化存储**: 确保数据不会在容器重启时丢失
2. **定期清理日志**: 设置日志轮转策略
3. **监控资源使用**: 关注 CPU 和内存使用情况
4. **数据库优化**: 定期清理旧的任务日志

## 安全建议

1. **更改默认密码**: 首次登录后立即更改管理员密码
2. **使用强密钥**: 为 `APP_SECRET_KEY` 设置强随机字符串
3. **启用 TOTP**: 为管理员账号启用两步验证
4. **定期更新**: 保持应用和依赖包更新到最新版本
5. **限制访问**: 如果可能，使用 IP 白名单或 VPN 限制访问

## 更新日志

### 2024-12-24
- 修复 API 路由被静态文件覆盖的问题
- 修复 Pydantic 版本兼容性问题
- 优化 Docker 构建流程
- 添加健康检查
- 添加 .dockerignore 文件
- 完善依赖包安装
