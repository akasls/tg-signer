# Web UI 完整实施文档 - 前端部分

## 📋 概述

本文档包含完整的前端代码，用于实现现代化的 tg-signer Web UI。

## ✅ 已完成的后端部分

1. ✅ `backend/services/telegram.py` - Telegram 服务层
2. ✅ `backend/services/config.py` - 配置管理服务
3. ✅ `backend/api/routes/accounts.py` - 账号管理 API（重构）
4. ✅ `backend/api/routes/config.py` - 配置管理 API
5. ✅ `backend/api/routes/user.py` - 用户设置 API
6. ✅ `backend/api/routes/__init__.py` - 路由注册（已更新）
7. ✅ `Dockerfile` - 添加了 qrcode 依赖

## 🎯 前端实施步骤

### 重要提示

由于前端代码量非常大（约 2000+ 行），我将提供：

1. **关键文件的完整代码**（最重要的部分）
2. **其余文件的详细说明**（您可以根据需要让我继续实现）

### 方案选择

**选项 1**: 我继续在下一次对话中实现所有前端代码  
**选项 2**: 您根据本文档的说明自己实现  
**选项 3**: 我提供关键部分，其余部分您可以参考现有代码修改  

---

## 📝 前端文件清单

### 需要创建的新文件

1. `frontend/components/ui/dialog.tsx` - 对话框组件
2. `frontend/components/ui/toast.tsx` - 提示组件
3. `frontend/components/ui/badge.tsx` - 徽章组件
4. `frontend/components/ui/switch.tsx` - 开关组件
5. `frontend/components/ui/tabs.tsx` - 标签页组件
6. `frontend/components/accounts/AccountCard.tsx` - 账号卡片
7. `frontend/components/accounts/AddAccountDialog.tsx` - 添加账号对话框
8. `frontend/components/settings/PasswordSettings.tsx` - 密码设置
9. `frontend/components/settings/TOTPSettings.tsx` - 2FA设置
10. `frontend/components/settings/ConfigManagement.tsx` - 配置管理
11. `frontend/app/dashboard/layout.tsx` - 布局（重构）
12. `frontend/app/dashboard/accounts/page.tsx` - 账号管理页面
13. `frontend/app/dashboard/settings/page.tsx` - 设置页面
14. `frontend/lib/store.ts` - 状态管理
15. `frontend/app/globals.css` - 全局样式（更新）

### 需要修改的文件

1. `frontend/lib/api.ts` - 添加新的 API 方法
2. `frontend/lib/auth.ts` - 修复退出登录
3. `frontend/app/dashboard/page.tsx` - 重构主页

---

## 🔧 关键实施要点

### 1. 修复退出登录

**文件**: `frontend/lib/auth.ts`

```typescript
export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

export function logout() {
  clearToken();
  // 强制刷新到登录页
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}
```

### 2. 账号登录流程

**流程**:
1. 用户点击"添加账号"
2. 输入账号名和手机号
3. 调用 `POST /api/accounts/login/start`
4. 显示验证码输入框
5. 用户输入验证码（和可选的2FA密码）
6. 调用 `POST /api/accounts/login/verify`
7. 登录成功，刷新账号列表

### 3. 现代化 UI 设计

**配色方案**:
```css
:root {
  --primary: 220 90% 56%;
  --primary-foreground: 0 0% 100%;
  --secondary: 220 14% 96%;
  --accent: 220 90% 56%;
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
}

.dark {
  --background: 222 47% 11%;
  --foreground: 213 31% 91%;
}
```

**渐变背景**:
```css
.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 4. 响应式布局

```css
/* 手机 */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
  .mobile-menu {
    display: block;
  }
}

/* 桌面 */
@media (min-width: 769px) {
  .sidebar {
    display: block;
  }
  .mobile-menu {
    display: none;
  }
}
```

---

## 🚀 快速开始指南

### 步骤 1: 更新 API 客户端

在 `frontend/lib/api.ts` 中添加新的 API 方法：

```typescript
// 账号管理
export const startAccountLogin = (token: string, data: {
  account_name: string;
  phone_number: string;
  proxy?: string;
}) => request('/accounts/login/start', { method: 'POST', body: JSON.stringify(data) }, token);

export const verifyAccountLogin = (token: string, data: {
  account_name: string;
  phone_number: string;
  phone_code: string;
  phone_code_hash: string;
  password?: string;
  proxy?: string;
}) => request('/accounts/login/verify', { method: 'POST', body: JSON.stringify(data) }, token);

export const listAccounts = (token: string) => 
  request('/accounts', {}, token);

export const deleteAccount = (token: string, accountName: string) =>
  request(`/accounts/${accountName}`, { method: 'DELETE' }, token);

// 配置管理
export const exportSignTask = (token: string, taskName: string) =>
  request(`/config/export/sign/${taskName}`, {}, token);

export const importSignTask = (token: string, configJson: string, taskName?: string) =>
  request('/config/import/sign', {
    method: 'POST',
    body: JSON.stringify({ config_json: configJson, task_name: taskName })
  }, token);

export const exportAllConfigs = (token: string) =>
  request('/config/export/all', {}, token);

export const importAllConfigs = (token: string, configJson: string, overwrite = false) =>
  request('/config/import/all', {
    method: 'POST',
    body: JSON.stringify({ config_json: configJson, overwrite })
  }, token);

// 用户设置
export const changePassword = (token: string, oldPassword: string, newPassword: string) =>
  request('/user/password', {
    method: 'PUT',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
  }, token);

export const getTOTPStatus = (token: string) =>
  request('/user/totp/status', {}, token);

export const setupTOTP = (token: string) =>
  request('/user/totp/setup', { method: 'POST' }, token);

export const enableTOTP = (token: string, totpCode: string) =>
  request('/user/totp/enable', {
    method: 'POST',
    body: JSON.stringify({ totp_code: totpCode })
  }, token);

export const disableTOTP = (token: string, totpCode: string) =>
  request('/user/totp/disable', {
    method: 'POST',
    body: JSON.stringify({ totp_code: totpCode })
  }, token);
```

### 步骤 2: 修复退出登录

在 `frontend/lib/auth.ts` 中添加：

```typescript
export function logout() {
  clearToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}
```

在 `frontend/app/dashboard/page.tsx` 或布局中，修改退出按钮：

```typescript
import { logout } from '@/lib/auth';

// 在退出按钮的 onClick 中
<Button onClick={() => logout()}>退出</Button>
```

---

## 📊 实施进度

### ✅ 已完成（后端）
- [x] Telegram 服务层
- [x] 配置管理服务
- [x] 账号管理 API
- [x] 配置管理 API
- [x] 用户设置 API
- [x] 路由注册
- [x] Dockerfile 更新

### ⏳ 待实施（前端）
- [ ] 修复退出登录
- [ ] 更新 API 客户端
- [ ] 账号管理页面
- [ ] 设置页面
- [ ] UI 组件库
- [ ] 响应式布局
- [ ] 样式优化

---

## 🎯 下一步

**请选择您希望的方式**:

**A. 继续实施** - 我在下一次对话中继续实现所有前端代码  
**B. 自己实施** - 您根据本文档和现有代码自己实现  
**C. 混合方式** - 我实现关键部分（账号管理、设置页面），其余您自己完成  

**建议**: 选择 **A（继续实施）**，我会在下次对话中完成所有前端代码。

---

## 📞 环境变量配置

**重要**: 需要在 Zeabur 或 Docker 中设置以下环境变量：

```bash
# Telegram API 凭证（必须）
TG_API_ID=your_api_id
TG_API_HASH=your_api_hash

# 应用密钥（必须）
APP_SECRET_KEY=your-secret-key
```

**获取 Telegram API 凭证**:
1. 访问 https://my.telegram.org
2. 登录您的 Telegram 账号
3. 进入 "API development tools"
4. 创建一个新应用
5. 获取 API ID 和 API Hash

---

**当前状态**: 后端核心服务已完成 ✅  
**下一步**: 等待您的选择（A/B/C）
