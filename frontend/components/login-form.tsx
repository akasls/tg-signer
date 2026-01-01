"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../lib/api";
import { setToken } from "../lib/auth";
import {
  Lightning,
  Spinner,
} from "@phosphor-icons/react";
import { ThemeLanguageToggle } from "./ThemeLanguageToggle";
import { useLanguage } from "../context/LanguageContext";

export default function LoginForm() {
  const router = useRouter();
  const { t, language } = useLanguage();

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
      const msg = err?.message || t("login_failed");
      let displayMsg = msg;
      if (msg.includes("Invalid credentials") || msg.includes("Invalid username or password")) {
        displayMsg = t("user_or_pass_error");
      } else if (msg.includes("TOTP code required") || msg.includes("Invalid TOTP code")) {
        displayMsg = t("totp_error");
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
          <p className="text-[#9496a1] text-xs mt-2">{language === "zh" ? "Telegram 自动签到控制台" : "Telegram Auto Sign-in Dashboard"}</p>
        </div>

        <form onSubmit={handleSubmit} className="text-left">
          <div className="mb-5">
            <label>{t("username")}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={language === "zh" ? "请输入用户名" : "Enter username"}
            />
          </div>
          <div className="mb-5">
            <label>{t("password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={language === "zh" ? "请输入密码" : "Enter password"}
            />
          </div>
          <div className="mb-5">
            <label>{t("totp")}</label>
            <input
              type="text"
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              placeholder={language === "zh" ? "如未启用请留空" : "Leave blank if disabled"}
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
                {language === "zh" ? "正在安全验证..." : "Verifying..."}
              </>
            ) : (
              language === "zh" ? "进入控制台" : "Access Console"
            )}
          </button>
        </form>

        <div className="login-footer-icons">
          <ThemeLanguageToggle />
        </div>
      </div>
    </div>
  );
}
