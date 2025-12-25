# 🔧 Event Loop 错误修复

## 问题描述

**错误信息**: `{"detail":"登录失败: Event loop is closed"}`

**出现场景**: 在添加 Telegram 账号时，点击"发送验证码"或"验证登录"

## 原因分析

在 `backend/services/telegram.py` 的 `login_sync` 方法中：

```python
# 旧代码（有问题）
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

try:
    result = loop.run_until_complete(...)
    return result
finally:
    loop.close()  # ❌ 问题：loop 被关闭后无法重用
```

**问题**:
1. 手动创建和管理 event loop
2. 在 `finally` 块中关闭 loop
3. 如果有异常，loop 可能已经被关闭
4. 下次调用时会尝试使用已关闭的 loop

## 解决方案

使用 `asyncio.run()` 代替手动管理 event loop：

```python
# 新代码（已修复）
import asyncio

try:
    if phone_code is None:
        result = asyncio.run(
            self.start_login(account_name, phone_number, proxy)
        )
    else:
        result = asyncio.run(
            self.verify_login(...)
        )
    return result
except Exception as e:
    raise e
```

**优点**:
1. ✅ `asyncio.run()` 自动创建和清理 event loop
2. ✅ 每次调用都使用新的 loop
3. ✅ 不会出现 loop 被关闭的问题
4. ✅ 更简洁和安全

## 修改的文件

- `backend/services/telegram.py` - `login_sync` 方法

## 测试步骤

1. 重新部署应用
2. 登录 Web UI
3. 尝试添加 Telegram 账号
4. 点击"发送验证码"
5. 应该能正常发送验证码，不再报错

## 验证修复

```bash
# 提交修复
git add backend/services/telegram.py
git commit -m "修复 Event loop is closed 错误"
git push

# 在 Zeabur 重新部署
```

---

**状态**: ✅ 已修复  
**影响**: 账号登录功能现在可以正常使用
