"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, resetTOTP } from "../lib/api";
import { setToken } from "../lib/auth";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
    <Card className="w-full max-w-md shadow">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">
          tg-signer 控制台登录
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>用户名</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label>密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>TOTP (可选)</Label>
            <Input
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              placeholder="如未启用两步验证，请留空"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 p-2 bg-green-50 rounded">
              {success}
            </div>
          )}

          {showTotpHelp && (
            <div className="text-sm p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-medium text-yellow-800 mb-2">无法登录？</p>
              <p className="text-yellow-700 mb-2">
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
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
