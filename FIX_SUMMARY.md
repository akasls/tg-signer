# tg-signer 容器崩溃问题修复总结

## 修复日期
2024-12-24

## 问题描述
项目在部署到 Zeabur 时容器一直崩溃，无法正常运行。

## 根本原因分析

经过代码审查，发现以下几个关键问题：

### 1. **API 路由被静态文件覆盖** ⭐ 主要问题
**问题**: 
- 在 `backend/main.py` 中，静态文件挂载在根路径 `/`
- API 路由没有前缀，直接挂载在根路径
- FastAPI 的路由匹配顺序导致静态文件处理器覆盖了所有 API 路由
- 前端调用 `/auth/login` 等 API 时返回的是静态文件而不是 API 响应

**影响**:
- 所有 API 请求失败
- 前端无法登录
- 应用无法正常工作

**修复**:
- 将所有 API 路由添加 `/api` 前缀
- 确保 API 路由在静态文件挂载之前注册
- 更新前端 API 基础路径为 `/api`
- 更新 OAuth2 tokenUrl 为 `/api/auth/login`

### 2. **Pydantic 版本兼容性问题**
**问题**:
- `backend/core/config.py` 直接从 `pydantic` 导入 `BaseSettings`
- Pydantic v2 中 `BaseSettings` 已移至 `pydantic-settings` 包
- 项目固定使用 `pydantic<2`，但导入方式不兼容

**影响**:
- 可能导致导入错误
- 配置加载失败

**修复**:
- 添加兼容性导入，优先尝试从 `pydantic.v1` 导入
- 如果失败则回退到 `pydantic` 导入

### 3. **依赖包不完整**
**问题**:
- Dockerfile 中缺少一些必要的依赖包
- `python-jose` 没有指定 cryptography 后端
- `uvicorn` 没有安装标准扩展
- 缺少 `python-multipart`（FastAPI 处理表单数据需要）

**影响**:
- 运行时可能出现导入错误
- 某些功能无法正常工作

**修复**:
- 安装 `uvicorn[standard]` 而不是 `uvicorn`
- 安装 `python-jose[cryptography]` 而不是 `python-jose`
- 添加 `python-multipart` 依赖

### 4. **Docker 构建效率低**
**问题**:
- 没有 `.dockerignore` 文件
- 构建时复制了大量不必要的文件
- 层级结构不优化，缓存利用率低

**影响**:
- 构建时间长
- 镜像体积大
- 部署效率低

**修复**:
- 创建 `.dockerignore` 文件
- 优化 Dockerfile 层级结构
- 先复制依赖文件，再复制源代码

### 5. **缺少健康检查**
**问题**:
- Dockerfile 中没有配置健康检查
- 容器编排系统无法判断应用是否正常运行

**影响**:
- 无法自动重启失败的容器
- 难以监控应用状态

**修复**:
- 添加 HEALTHCHECK 指令
- 使用 `/health` 端点进行健康检查

## 修改的文件清单

### 后端文件
1. **backend/main.py**
   - 添加 API 路由前缀 `/api`
   - 调整路由注册顺序
   - 添加注释说明

2. **backend/core/config.py**
   - 添加 Pydantic 兼容性导入

3. **backend/core/auth.py**
   - 更新 OAuth2 tokenUrl 为 `/api/auth/login`

### 前端文件
4. **frontend/lib/api.ts**
   - 更新 API_BASE 默认值为 `/api`

### Docker 相关
5. **Dockerfile**
   - 优化构建层级
   - 添加完整依赖
   - 添加健康检查
   - 改进注释

6. **.dockerignore** (新建)
   - 排除不必要的文件
   - 优化构建速度

### 文档和配置
7. **.env.example** (新建)
   - 环境变量示例

8. **ZEABUR_DEPLOY.md** (新建)
   - Zeabur 部署指南
   - 问题修复说明
   - 配置说明

9. **test_api.py** (新建)
   - API 测试脚本
   - 用于本地验证

## 验证步骤

### 本地验证
```bash
# 1. 构建镜像
docker build -t tg-signer .

# 2. 运行容器
docker run -p 3000:3000 \
  -e APP_SECRET_KEY=test-secret-key \
  -v ./data:/data \
  tg-signer

# 3. 运行测试脚本
python test_api.py

# 4. 手动测试
# 访问 http://localhost:3000
# 使用 admin/admin123 登录
```

### Zeabur 部署验证
1. 推送代码到 Git 仓库
2. 在 Zeabur 中创建新服务
3. 设置环境变量 `APP_SECRET_KEY`
4. 添加持久化存储卷挂载到 `/data`
5. 等待构建和部署完成
6. 访问应用 URL
7. 使用默认账号登录

## 预期结果

修复后，应用应该能够：
- ✅ 成功构建 Docker 镜像
- ✅ 容器正常启动
- ✅ 健康检查通过
- ✅ 前端页面正常加载
- ✅ API 请求正常响应
- ✅ 用户可以登录
- ✅ 所有功能正常工作

## 后续建议

### 安全性
1. 首次登录后立即修改默认密码
2. 为 `APP_SECRET_KEY` 设置强随机字符串
3. 考虑启用 TOTP 两步验证
4. 定期更新依赖包

### 性能优化
1. 考虑使用 Redis 缓存
2. 定期清理旧日志
3. 监控资源使用情况

### 监控和日志
1. 配置日志收集
2. 设置告警规则
3. 定期检查健康状态

### 备份
1. 定期备份 `/data` 目录
2. 备份数据库文件
3. 保存重要配置

## 技术债务

以下问题建议在未来版本中解决：

1. **API 版本管理**: 考虑添加 API 版本号（如 `/api/v1`）
2. **错误处理**: 改进全局错误处理和错误消息
3. **日志系统**: 使用结构化日志（如 structlog）
4. **测试覆盖**: 添加单元测试和集成测试
5. **文档**: 添加 API 文档（Swagger/OpenAPI）
6. **配置验证**: 启动时验证所有必需的配置项

## 联系方式

如有问题，请查看：
- 项目 README: `README.md`
- 部署指南: `ZEABUR_DEPLOY.md`
- 测试脚本: `test_api.py`

---

**修复完成时间**: 2024-12-24  
**修复者**: AI Assistant  
**版本**: v0.1.0-fixed
