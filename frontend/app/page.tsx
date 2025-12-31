"use client";

import { useEffect, useState } from "react";
import LoginForm from "../components/login-form";
import { getToken } from "../lib/auth";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (token) {
      // 使用硬跳转确保在静态导出模式下正常工作
      window.location.href = "/dashboard";
    }
  }, []);

  // 在挂载前不渲染任何内容，避免闪烁
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <LoginForm />
    </div>
  );
}


