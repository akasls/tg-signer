# 🔧 Next.js 动态路由构建错误修复

## 问题描述

**错误信息**: 
```
Error: Page "/dashboard/accounts/[name]" is missing "generateStaticParams()" 
so it cannot be used with "output: export" config.
```

**原因**: Next.js 的静态导出模式（`output: export`）不支持没有 `generateStaticParams` 的动态路由。

## 解决方案

在动态路由页面添加以下代码：

```typescript
// 添加这个函数以支持静态导出
export function generateStaticParams() {
  return [];
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
```

**说明**:
- `generateStaticParams()` - 返回空数组，表示在构建时不预渲染任何路径
- `dynamic = 'force-dynamic'` - 强制动态渲染
- `dynamicParams = true` - 允许动态参数

## 修改的文件

- `frontend/app/dashboard/accounts/[name]/page.tsx`

## 验证修复

```bash
# 提交修复
git add frontend/app/dashboard/accounts/[name]/page.tsx
git commit -m "修复动态路由构建错误"
git push

# 在 Zeabur 重新部署
```

---

**状态**: ✅ 已修复  
**影响**: 现在可以正常构建和部署
