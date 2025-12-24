# Web UI 面板使用指南

## 概述

tg-signer 现在提供了一个现代化的 Web UI 控制面板，让您可以通过浏览器轻松管理 Telegram 账号和签到任务。

## 功能特性

### ✨ 主要功能

- 🔐 **安全认证**: 支持用户名/密码登录，可选 TOTP 两步验证
- 👤 **账号管理**: 添加、配置和管理多个 Telegram 账号
- 📋 **任务管理**: 创建、编辑、启用/禁用定时签到任务
- 📊 **日志查看**: 实时查看任务执行日志和状态
- 🎯 **一键运行**: 手动触发任务立即执行
- 📱 **响应式设计**: 支持桌面和移动设备访问

## 快速开始

### Docker 部署（推荐）

```bash
# 1. 构建镜像
docker build -t tg-signer .

# 2. 运行容器
docker run -d \
  --name tg-signer \
  -p 3000:3000 \
  -e APP_SECRET_KEY=your-very-secure-random-key \
  -v ./data:/data \
  tg-signer

# 3. 访问 Web UI
# 打开浏览器访问: http://localhost:3000
```

### Zeabur 一键部署

1. Fork 本项目到您的 GitHub
2. 在 Zeabur 创建新服务
3. 连接您的 GitHub 仓库
4. 设置环境变量 `APP_SECRET_KEY`
5. 添加持久化存储卷挂载到 `/data`
6. 部署完成后访问分配的 URL

## 使用说明

### 1. 首次登录

- **默认账号**: `admin`
- **默认密码**: `admin123`
- **重要**: 首次登录后请立即修改密码！

### 2. 添加 Telegram 账号

1. 在"账号管理"区域填写：
   - **账号名称**: 自定义名称（如 `my_account`）
   - **API ID**: 从 https://my.telegram.org 获取
   - **API Hash**: 从 https://my.telegram.org 获取
   - **代理**: （可选）格式如 `socks5://127.0.0.1:1080`

2. 点击"添加账号"

3. 点击"登录"按钮开始登录流程

4. 在"验证码/2FA 验证"区域：
   - 输入账号 ID
   - 输入收到的验证码
   - 如有 2FA，输入 Telegram 密码
   - 点击"提交验证"

### 3. 创建签到任务

1. 在"任务管理"区域填写：
   - **任务名称**: 对应 tg-signer 配置名（如 `my_sign`）
   - **CRON 表达式**: 定时规则（如 `0 6 * * *` 表示每天早上6点）
   - **绑定账号**: 选择要使用的 Telegram 账号

2. 点击"创建任务"

### 4. 管理任务

- **立即运行**: 手动触发任务执行
- **查看日志**: 查看任务执行历史和输出
- **启用/停用**: 控制任务是否自动执行
- **删除**: 删除不需要的任务

## CRON 表达式示例

```
0 6 * * *     # 每天早上 6:00
0 */2 * * *   # 每 2 小时
30 8 * * 1-5  # 工作日早上 8:30
0 0 1 * *     # 每月 1 号午夜
```

## API 端点

所有 API 端点都在 `/api` 前缀下：

### 认证
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 账号
- `GET /api/accounts` - 获取账号列表
- `POST /api/accounts` - 创建新账号
- `POST /api/accounts/{id}/login/start` - 开始登录流程
- `POST /api/accounts/{id}/login/verify` - 验证登录码

### 任务
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建新任务
- `PUT /api/tasks/{id}` - 更新任务
- `DELETE /api/tasks/{id}` - 删除任务
- `POST /api/tasks/{id}/run` - 立即运行任务
- `GET /api/tasks/{id}/logs` - 获取任务日志

## 环境变量配置

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `APP_SECRET_KEY` | JWT 密钥（必须设置强随机字符串） | `your-secret-key` |

### 可选配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `APP_ACCESS_TOKEN_EXPIRE_HOURS` | 12 | Token 过期时间（小时） |
| `APP_DATA_DIR` | /data | 数据存储目录 |
| `PORT` | 3000 | 服务端口 |

### 生成安全密钥

```bash
# 使用 Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# 使用 OpenSSL
openssl rand -base64 32
```

## 数据持久化

所有数据存储在 `/data` 目录：

```
/data/
├── db.sqlite          # 数据库（用户、账号、任务）
├── .signer/           # tg-signer 配置和记录
├── sessions/          # Telegram 会话文件
└── logs/              # 应用日志
```

**重要**: 请确保 `/data` 目录已正确挂载到持久化存储！

## 安全建议

1. ✅ **修改默认密码**: 首次登录后立即修改
2. ✅ **使用强密钥**: 为 `APP_SECRET_KEY` 设置强随机字符串
3. ✅ **启用 HTTPS**: 生产环境必须使用 HTTPS
4. ✅ **定期备份**: 定期备份 `/data` 目录
5. ✅ **限制访问**: 使用防火墙或 VPN 限制访问
6. ✅ **启用 2FA**: 为管理员账号启用两步验证

## 故障排查

### 无法登录

1. 检查默认账号是否正确: `admin` / `admin123`
2. 查看容器日志: `docker logs -f tg-signer`
3. 确认 `APP_SECRET_KEY` 已设置

### API 请求失败

1. 确保使用 `/api` 前缀
2. 检查 token 是否有效
3. 查看浏览器控制台错误信息

### 任务无法执行

1. 确认任务已启用
2. 检查 CRON 表达式是否正确
3. 查看任务日志了解错误信息
4. 确认 tg-signer 配置文件存在

### 账号登录失败

1. 确认 API ID 和 API Hash 正确
2. 检查网络连接（如需要，配置代理）
3. 确认验证码输入正确
4. 如有 2FA，确认密码正确

## 技术栈

### 后端
- **FastAPI**: 现代 Python Web 框架
- **SQLAlchemy**: ORM 数据库操作
- **APScheduler**: 定时任务调度
- **Pydantic**: 数据验证
- **python-jose**: JWT 认证

### 前端
- **Next.js**: React 框架
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **shadcn/ui**: UI 组件库

## 开发相关

### 本地开发

```bash
# 后端
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload

# 前端
cd frontend
npm install
npm run dev
```

### 构建前端

```bash
cd frontend
npm run build
# 输出到 frontend/out 目录
```

### 运行测试

```bash
# API 测试
python test_api.py

# 单元测试
pytest tests/
```

## 更新日志

### v0.1.0 (2024-12-24)
- ✨ 新增 Web UI 控制面板
- 🐛 修复 API 路由被静态文件覆盖的问题
- 🔧 优化 Docker 构建流程
- 📝 完善文档和部署指南
- ✅ 添加健康检查和测试脚本

## 相关文档

- [修复总结](FIX_SUMMARY.md) - 问题分析和修复详情
- [Zeabur 部署指南](ZEABUR_DEPLOY.md) - Zeabur 部署步骤
- [快速参考](QUICK_REFERENCE.md) - 常用命令和故障排查
- [主 README](README.md) - 项目介绍和 CLI 使用

## 许可证

BSD-3-Clause License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**享受使用 tg-signer Web UI！** 🎉
