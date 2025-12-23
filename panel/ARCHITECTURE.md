你是一个资深全栈工程师 + DevOps 架构师。
我需要你基于现有仓库 tg-signer（https://github.com/amchii/tg-signer），开发一个全新的、完全替代原 WebUI 的可视化管理面板。

⚠️ 核心约束（非常重要）：
- 本项目必须 100% Docker First
- 用户不需要在宿主机安装 Python / Node / pnpm / npm
- 所有服务只能通过 docker 或 docker-compose 启动
- 最终目标是：一条命令即可启动整个系统

================================================
【总体目标】
================================================
构建一个 tg-signer 的可视化控制台，覆盖以下能力：
- 账号管理（添加 / 登录 / 2FA / session 管理）
- 签到任务管理（创建 / 编辑 / 启停 / 定时）
- 任务运行与日志查看
- 状态监控与失败重试
- 可部署在 Zeabur / 任意云平台 / 本地服务器

⚠️ 不修改 tg-signer 核心逻辑，避免深度耦合
⚠️ 所有交互通过 CLI / subprocess 实现

================================================
【架构强制要求（Docker First）】
================================================
1️⃣ 所有代码必须运行在 Docker 中
2️⃣ 提供 docker-compose.yml（默认启动方式）
3️⃣ 同时提供单容器 Dockerfile（可 docker run）
4️⃣ 数据必须通过 volume 持久化
5️⃣ 监听 0.0.0.0:$PORT（云平台友好）

================================================
【技术栈（固定，不要随意替换）】
================================================
后端：
- Python 3.12
- FastAPI
- Uvicorn
- SQLAlchemy + SQLite（MVP）
- APScheduler（任务调度）
- subprocess（调用 tg-signer CLI）

前端：
- Next.js（App Router）
- Tailwind CSS
- shadcn/ui
- 构建后输出纯静态文件

部署模式（必须支持）：
- 模式 A：前端 build → 静态文件由 FastAPI 托管（单容器）
- 模式 B：前后端分离（docker-compose 两个服务）

================================================
【tg-signer 集成方式（严格遵守）】
================================================
❌ 禁止直接 import tg_signer 内部模块
❌ 禁止依赖 tg-signer 内部 API

✅ 只允许：
- subprocess.run / asyncio.create_subprocess_exec
- 调用命令行：

  tg-signer --workdir /data/.signer --session_dir /data/sessions login <account>
  tg-signer --workdir /data/.signer --session_dir /data/sessions run <task>

- 所有参数、路径必须可配置

================================================
【数据与目录规范（Docker Volume）】
================================================
容器内固定目录结构（必须遵守）：

/app                # 后端代码
/web                # 前端构建产物
/data
 ├─ .signer         # tg-signer 工作目录
 ├─ sessions        # Telegram session 文件
 ├─ logs             # 任务日志
 └─ db.sqlite        # SQLite 数据库

docker-compose 默认挂载：
- ./data:/data

================================================
【MVP 功能（必须全部实现）】
================================================
1️⃣ 登录系统
- 管理员登录（用户名 + 密码）
- 密码 hash 存储
- 可选 TOTP 2FA

2️⃣ 账号管理
- 添加账号（account_name, api_id, api_hash, proxy）
- 触发登录流程（验证码 / 2FA）
- session 状态检测

3️⃣ 任务管理
- 创建签到任务
- 绑定账号
- cron 表达式
- 启停 / 删除
- 手动执行

4️⃣ 日志系统
- 每次运行记录日志
- 按任务查看
- 实时刷新（SSE 或 WebSocket）

================================================
【API 路由要求（FastAPI）】
================================================
- POST /auth/login
- GET  /auth/me
- CRUD /accounts
- POST /accounts/{id}/login/start
- POST /accounts/{id}/login/verify
- CRUD /tasks
- POST /tasks/{id}/run
- GET  /tasks/{id}/logs
- GET  /events/logs

================================================
【Docker 交付要求（非常重要）】
================================================
你必须提供：

1️⃣ Dockerfile（单容器）
- 包含后端
- 包含前端 build 结果
- CMD 一条命令启动整个系统

2️⃣ docker-compose.yml
- services:
  - app
- volumes:
  - ./data:/data
- ports:
  - 3000:3000 或 $PORT

3️⃣ README.md
- docker run 启动示例
- docker-compose 启动示例
- Zeabur 部署说明

================================================
【输出方式（强制分阶段）】
================================================
请严格按以下 Phase 输出：

Phase 0：系统架构图 + 目录结构
Phase 1：FastAPI 后端骨架 + DB Models
Phase 2：tg-signer CLI 调度与账号登录流程
Phase 3：任务调度 + 日志系统
Phase 4：前端 UI（Next.js + shadcn）
Phase 5：Dockerfile + docker-compose + README

每个 Phase 必须包含：
- 文件列表
- 完整代码块
- 启动方式
- 验证方法

⚠️ 不要一次性输出全部代码
⚠️ 每个阶段可独立运行
