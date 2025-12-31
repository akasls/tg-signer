"use client";

import { useEffect, useState } from "react";
import LoginForm from "../components/login-form";
import { getToken } from "../lib/auth";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    // 只有当有 token 且当前不在 dashboard 页面时才跳转
    if (token && typeof window !== 'undefined' && window.location.pathname === '/') {
      setRedirecting(true);
      window.location.href = "/dashboard";
    }
  }, []);

  // 在挂载前或跳转中不渲染任何内容
  if (!mounted || redirecting) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <LoginForm />
    </div>
  );
}


