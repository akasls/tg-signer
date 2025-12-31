"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, logout } from "../../lib/auth";
import {
  listAccounts,
  startAccountLogin,
  verifyAccountLogin,
  deleteAccount,
  listSignTasks,
  getAccountLogs,
  AccountInfo,
  AccountLog,
  LoginStartRequest,
  LoginVerifyRequest,
  SignTask,
} from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ToastContainer, useToast } from "../../components/ui/toast";
import { ThemeLanguageToggle } from "../../components/ThemeLanguageToggle";
import { useLanguage } from "../../context/LanguageContext";

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toasts, addToast, removeToast } = useToast();
  const [token, setLocalToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [tasks, setTasks] = useState<SignTask[]>([]);
  const [loading, setLoading] = useState(false);

  // 设置菜单
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // 日志弹窗
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [logsAccountName, setLogsAccountName] = useState("");
  const [accountLogs, setAccountLogs] = useState<AccountLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // 添加账号对话框
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loginStep, setLoginStep] = useState<"input" | "verify">("input");
  const [loginData, setLoginData] = useState({
    account_name: "",
    phone_number: "",
    proxy: "",
    phone_code: "",
    password: "",
    phone_code_hash: "",
  });

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const tokenStr = getToken();
    if (!tokenStr) {
      window.location.replace("/");
      return;
    }
    setLocalToken(tokenStr);
    setChecking(false);
    loadData(tokenStr);
  }, []);

  const loadData = async (tokenStr: string) => {
    try {
      setLoading(true);
      const [accountsData, tasksData] = await Promise.all([
        listAccounts(tokenStr),
        listSignTasks(tokenStr),
      ]);
      setAccounts(accountsData.accounts);
      setTasks(tasksData);
    } catch (err: any) {
      addToast(err.message || t("login_failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const getAccountTaskCount = (accountName: string) => {
    return tasks.filter(task => task.account_name === accountName).length;
  };

  const handleStartLogin = async () => {
    if (!token) return;
    if (!loginData.account_name || !loginData.phone_number) {
      addToast("请填写账号名称和手机号", "error");
      return;
    }
    try {
      setLoading(true);
      const res = await startAccountLogin(token, {
        account_name: loginData.account_name,
        phone_number: loginData.phone_number,
        proxy: loginData.proxy || undefined,
      });
      setLoginData({ ...loginData, phone_code_hash: res.phone_code_hash });
      setLoginStep("verify");
      addToast("验证码已发送", "success");
    } catch (err: any) {
      addToast(err.message || "发送失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async () => {
    if (!token) return;
    if (!loginData.phone_code) {
      addToast("请输入验证码", "error");
      return;
    }
    try {
      setLoading(true);
      await verifyAccountLogin(token, {
        account_name: loginData.account_name,
        phone_number: loginData.phone_number,
        phone_code: loginData.phone_code,
        phone_code_hash: loginData.phone_code_hash,
        password: loginData.password || undefined,
      });
      addToast("登录成功", "success");
      setShowAddDialog(false);
      loadData(token);
    } catch (err: any) {
      addToast(err.message || "验证失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (name: string) => {
    if (!token) return;
    if (!confirm(t("confirm_delete"))) return;
    try {
      setLoading(true);
      await deleteAccount(token, name);
      addToast("账号已删除", "success");
      loadData(token);
    } catch (err: any) {
      addToast(err.message || "删除失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleShowLogs = async (name: string) => {
    if (!token) return;
    setLogsAccountName(name);
    setShowLogsDialog(true);
    setLogsLoading(true);
    try {
      const logs = await getAccountLogs(token, name);
      setAccountLogs(logs);
    } catch (err: any) {
      addToast(err.message || "获取日志失败", "error");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!token || checking) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <nav className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-pulse-glow">⚡</div>
              <div>
                <h1 className="text-xl font-bold aurora-text">TG SignPulse</h1>
                <p className="text-[10px] text-dim tracking-widest uppercase">Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeLanguageToggle />
              <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>

              <Link
                href="/dashboard/settings"
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-main/70 hover:text-main"
                title={t("sidebar_settings")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-0">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-main mb-2">{t("sidebar_accounts")}</h1>
            <p className="text-muted">{t("sidebar_accounts")} 列表 ({accounts.length})</p>
          </div>
          <Button onClick={() => { setLoginStep("input"); setShowAddDialog(true); }} className="btn-primary gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t("add_account")}
          </Button>
        </header>

        {loading && accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="loading-spinner mb-4"></div>
            <span className="text-main/50">加载中...</span>
          </div>
        ) : accounts.length === 0 ? (
          <Card className="border-dashed border-white/10 bg-transparent">
            <CardContent className="py-20 text-center">
              <div className="text-6xl mb-6">📱</div>
              <h3 className="text-xl font-medium text-main mb-2">暂无 Telegram 账号</h3>
              <p className="text-muted mb-8">添加您的第一个账号以开始自动化签到</p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                立即添加
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.name}
                className="card-hover p-6 rounded-2xl flex flex-col items-center text-center relative group cursor-pointer"
                onClick={() => router.push(`/dashboard/account-tasks?name=${acc.name}`)}
              >
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShowLogs(acc.name); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-muted hover:text-cyan-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.name); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-muted hover:text-rose-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
                  👤
                </div>

                <h3 className="text-lg font-bold text-main truncate w-full mb-1">{acc.name}</h3>

                <div className="flex items-center gap-1.5 mt-auto pt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-muted uppercase tracking-wider">
                    {getAccountTaskCount(acc.name)} {t("sidebar_tasks")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <Card className="w-full max-w-lg shadow-2xl animate-scale-in">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-main">{loginStep === "input" ? t("add_account") : "安全验证"}</h2>
                <button onClick={() => setShowAddDialog(false)} className="p-2 hover:bg-white/10 rounded-lg text-dim hover:text-main transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loginStep === "input" ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>{t("username")} (唯一标识)</Label>
                    <Input
                      placeholder="例如: work_account"
                      className="glass-input"
                      value={loginData.account_name}
                      onChange={(e) => setLoginData({ ...loginData, account_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>手机号 (带国家码)</Label>
                    <Input
                      placeholder="+86138..."
                      className="glass-input"
                      value={loginData.phone_number}
                      onChange={(e) => setLoginData({ ...loginData, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>代理设置 (可选)</Label>
                    <Input
                      placeholder="socks5://user:pass@host:port"
                      className="glass-input"
                      value={loginData.proxy}
                      onChange={(e) => setLoginData({ ...loginData, proxy: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleStartLogin} className="w-full btn-primary h-12" disabled={loading}>
                    {loading ? "发送请求中..." : "获取验证码"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5 text-center">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-4xl">📩</div>
                  <p className="text-main/60 text-sm mb-4">验证码已发送至您的手机/Telegram 客户端</p>
                  <div className="space-y-4 text-left">
                    <div className="space-y-2">
                      <Label>验证码</Label>
                      <Input
                        placeholder="请输入 5 位数字"
                        className="glass-input text-center text-xl tracking-[1em]"
                        value={loginData.phone_code}
                        onChange={(e) => setLoginData({ ...loginData, phone_code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>两步验证密码 (如未开启请留空)</Label>
                      <Input
                        type="password"
                        placeholder="请输入密码"
                        className="glass-input"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 h-12" onClick={() => setLoginStep("input")}>返回</Button>
                    <Button onClick={handleVerifyLogin} className="flex-[2] btn-primary h-12" disabled={loading}>
                      {loading ? "正在验证..." : "完成登录"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showLogsDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <Card className="w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-main">{logsAccountName} 运行日志</h2>
              </div>
              <button onClick={() => setShowLogsDialog(false)} className="p-2 hover:bg-white/10 rounded-lg text-main/30 hover:text-main transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CardContent className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-black/20">
              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-main/30">
                  <div className="loading-spinner mb-4 border-cyan-500/30 border-t-cyan-500"></div>
                  读取中...
                </div>
              ) : accountLogs.length === 0 ? (
                <div className="text-center py-20 text-main/20">暂无运行日志</div>
              ) : (
                <div className="space-y-4">
                  {accountLogs.map((log, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-center mb-3 text-xs">
                        <span className="text-main/30">{new Date(log.created_at).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full ${log.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {log.success ? 'SUCCESS' : 'FAILURE'}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap text-main/70 leading-relaxed overflow-x-auto max-h-[200px] scrollbar-thin">
                        {log.message}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t border-white/10 text-center bg-white/5">
              <Button variant="secondary" onClick={() => setShowLogsDialog(false)} className="px-10">
                关闭
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
