"use client";

import { useEffect, useState } from "react";
import LoginForm from "../components/login-form";
import { getToken } from "../lib/auth";

export default function Home() {
  const [hasToken, setHasToken] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 检查是否有 token
    const token = getToken();
    setHasToken(!!token);
    setChecking(false);

    // 如果有 token，使用 replace 跳转（不添加历史记录）
    if (token) {
      window.location.replace("/dashboard");
    }
  }, []);

  // 正在检查或有 token 时不显示登录表单
  if (checking || hasToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <LoginForm />
    </div>
  );
}

