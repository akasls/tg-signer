"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, resetTOTP } from "../lib/api";
import { setToken } from "../lib/auth";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [totp, setTotp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTotpHelp, setShowTotpHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await login({ username, password, totp_code: totp || undefined });
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      const errMsg = err?.message || "登录失败";
      setError(errMsg);
      // 如果是 TOTP 相关错误，显示帮助提示
      if (errMsg.includes("TOTP") || errMsg.includes("totp")) {
        setShowTotpHelp(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetTOTP = async () => {
    if (!username || !password) {
      setError("请先填写用户名和密码");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await resetTOTP({ username, password });
      setSuccess(res.message);
      setShowTotpHelp(false);
      setTotp("");
    } catch (err: any) {
      setError(err?.message || "重置失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-lg relative animate-scale-in">
        <CardContent className="p-10">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 animate-pulse-glow inline-block rounded-full p-2">⚡</div>
            <h1 className="text-2xl font-bold aurora-text mb-2">TG SignPulse</h1>
            <p className="text-white/50 text-sm">Telegram 自动签到控制台</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
              />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
              />
            </div>
            <div className="space-y-2">
              <Label>两步验证码 (可选)</Label>
              <Input
                value={totp}
                onChange={(e) => setTotp(e.target.value)}
                placeholder="如未启用两步验证，请留空"
              />
            </div>

            {error && (
              <div className="text-sm text-rose-300 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-emerald-300 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                {success}
              </div>
            )}

            {showTotpHelp && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="font-medium text-amber-300 mb-2">无法登录？</p>
                <p className="text-amber-200/70 text-sm mb-3">
                  如果您未完成两步验证设置但系统要求输入验证码，可以点击下方按钮重置。
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetTOTP}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "重置中..." : "重置两步验证"}
                </Button>
              </div>
            )}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  登录中...
                </span>
              ) : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
