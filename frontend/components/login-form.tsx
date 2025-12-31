"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, resetTOTP } from "../lib/api";
import { setToken } from "../lib/auth";
import { 
  Lightning, 
  Spinner, 
  Translate, 
  Sun, 
  Moon, 
  GithubLogo, 
  PaperPlaneRight 
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

export default function LoginForm() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [totp, setTotp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await login({ username, password, totp_code: totp || undefined });
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "登录失败";
      let displayMsg = msg;
      if (msg.includes("Invalid credentials") || msg.includes("Invalid username or password")) {
        displayMsg = "用户名或密码错误";
      } else if (msg.includes("TOTP code required") || msg.includes("Invalid TOTP code")) {
        displayMsg = "两步验证码错误或已过期";
      }
      setErrorMsg(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-view" className="w-full h-full flex justify-center items-center relative p-5 animate-float-up">
      <div className="glass-panel w-full max-w-[400px] p-12 text-center">
        <div className="mb-8">
          <Lightning 
            weight="fill" 
            className="inline-block" 
            style={{ fontSize: '56px', color: '#fcd34d', filter: 'drop-shadow(0 0 10px rgba(252, 211, 77, 0.4))' }} 
          />
          <div className="brand-text-grad mt-3">TG SignPulse</div>
          <p className="text-[#9496a1] text-xs mt-2">Telegram 自动签到控制台</p>
        </div>

        <form onSubmit={handleSubmit} className="text-left">
          <div className="mb-5">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          <div className="mb-5">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          <div className="mb-5">
            <label>2FA 动态码 (可选)</label>
            <input
              type="text"
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              placeholder="如未启用请留空"
              className="text-center tracking-[2px]"
            />
          </div>

          {errorMsg && (
            <div className="text-[#ff4757] text-xs mb-4 text-center bg-[#ff4757]/10 p-2 rounded-lg">
              {errorMsg}
            </div>
          )}

          <button className="btn-gradient w-full" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner className="animate-spin" size={20} />
                正在安全验证...
              </>
            ) : (
              "进入控制台"
            )}
          </button>
        </form>

        <div className="flex justify-center gap-5 mt-8 pt-6 border-t border-white/10">
          <div className="action-btn" title="Language"><Translate weight="bold" /></div>
          <div className="action-btn" title="Theme" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun weight="bold" /> : <Moon weight="bold" />}
          </div>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="action-btn" title="GitHub">
            <GithubLogo weight="bold" />
          </a>
        </div>
      </div>
    </div>
  );
}
