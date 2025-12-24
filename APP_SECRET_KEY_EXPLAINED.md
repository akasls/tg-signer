# APP_SECRET_KEY 说明

## 🔐 什么是 APP_SECRET_KEY？

`APP_SECRET_KEY` 是用于 **JWT (JSON Web Token) 加密和签名**的密钥。

## 🎯 它的作用

### 1. 用户登录认证

当您登录 Web UI 时：

```
用户登录 → 验证用户名密码 → 生成 JWT Token → 返回给浏览器
```

JWT Token 包含：
- 用户信息（用户名、ID）
- 过期时间
- 使用 `APP_SECRET_KEY` 加密的签名

### 2. 保护 API 请求

每次您访问 API 时：

```
浏览器发送请求 → 携带 JWT Token → 服务器验证签名 → 允许/拒绝访问
```

服务器使用 `APP_SECRET_KEY` 验证 Token 是否被篡改。

### 3. 防止伪造

如果没有 `APP_SECRET_KEY`，任何人都可以：
- ❌ 伪造 Token
- ❌ 冒充其他用户
- ❌ 访问受保护的 API

有了 `APP_SECRET_KEY`：
- ✅ 只有服务器能生成有效的 Token
- ✅ Token 无法被伪造
- ✅ 保护您的数据安全

## 🔑 如何生成

### 方法 1: 使用 Python

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

输出示例：
```
xK7vN9mP2qR5sT8wU1yV4zA6bC3dE0fG1hI2jK3lM4n
```

### 方法 2: 使用 OpenSSL

```bash
openssl rand -base64 32
```

### 方法 3: 在线生成

访问: https://generate-secret.vercel.app/32

## ⚠️ 安全建议

### ✅ 应该做的

1. **使用强密钥**
   - 至少 32 个字符
   - 包含随机字母、数字、符号

2. **保密**
   - 不要提交到 Git
   - 不要分享给他人
   - 只在服务器环境变量中设置

3. **定期更换**
   - 如果怀疑泄露，立即更换
   - 更换后所有用户需要重新登录

### ❌ 不应该做的

1. ❌ 使用简单密码（如 `123456`）
2. ❌ 使用默认值（如 `secret`）
3. ❌ 提交到代码仓库
4. ❌ 在多个项目中重复使用

## 📝 在 Zeabur 设置

1. 进入 Zeabur 控制台
2. 选择您的服务
3. 点击 "Variables" 或"环境变量"
4. 添加环境变量：
   ```
   名称: APP_SECRET_KEY
   值: xK7vN9mP2qR5sT8wU1yV4zA6bC3dE0fG1hI2jK3lM4n
   ```
5. 保存并重新部署

## 🔄 如果更换密钥

**后果**:
- 所有现有的 JWT Token 会失效
- 所有用户需要重新登录
- 不会丢失数据

**步骤**:
1. 生成新的密钥
2. 在 Zeabur 更新环境变量
3. 重新部署
4. 通知用户重新登录

## 💡 总结

`APP_SECRET_KEY` 就像您家的钥匙：

- 🔑 **钥匙** = APP_SECRET_KEY
- 🏠 **房子** = 您的 Web UI
- 🚪 **门锁** = JWT 验证机制

没有正确的钥匙，任何人都无法进入您的"房子"（访问 API）。

---

**重要**: 这是唯一必须设置的环境变量！其他的都有默认值。
