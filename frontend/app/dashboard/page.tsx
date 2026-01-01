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
  getAccountLogs,
  listSignTasks,
  AccountInfo,
  AccountLog,
  SignTask,
} from "../../lib/api";
import {
  Lightning,
  Plus,
  Gear,
  GithubLogo,
  Trash,
  ListDashes,
  Clock,
  Spinner,
  X,
  PaperPlaneRight
} from "@phosphor-icons/react";
import { ToastContainer, useToast } from "../../components/ui/toast";
import { ThemeLanguageToggle } from "../../components/ThemeLanguageToggle";
import { useLanguage } from "../../context/LanguageContext";

export default function Dashboard() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { toasts, addToast, removeToast } = useToast();
  const [token, setLocalToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [tasks, setTasks] = useState<SignTask[]>([]);
  const [loading, setLoading] = useState(false);

  // 日志弹窗
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [logsAccountName, setLogsAccountName] = useState("");
  const [accountLogs, setAccountLogs] = useState<AccountLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // 添加账号对话框
  const [showAddDialog, setShowAddDialog] = useState(false);
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
      addToast(language === "zh" ? "请填写账号名称和手机号" : "Please fill in account name and phone number", "error");
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
      addToast(t("code_sent"), "success");
    } catch (err: any) {
      addToast(err.message || (language === "zh" ? "发送失败" : "Failed to send"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async () => {
    if (!token) return;
    if (!loginData.phone_code) {
      addToast(language === "zh" ? "请输入验证码" : "Please enter code", "error");
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
      addToast(t("login_success"), "success");
      setShowAddDialog(false);
      loadData(token);
    } catch (err: any) {
      addToast(err.message || (language === "zh" ? "验证失败" : "Verification failed"), "error");
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
      addToast(language === "zh" ? "账号已删除" : "Account deleted", "success");
      loadData(token);
    } catch (err: any) {
      addToast(err.message || (language === "zh" ? "删除失败" : "Failed to delete"), "error");
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
      addToast(err.message || (language === "zh" ? "获取日志失败" : "Failed to get logs"), "error");
    } finally {
      setLogsLoading(false);
    }
  };

  if (!token || checking) {
    return null;
  }

  return (
    <div id="dashboard-view" className="w-full h-full flex flex-col">
      <nav className="navbar">
        <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Lightning weight="fill" style={{ fontSize: '28px', color: '#fcd34d' }} />
          <span className="nav-title">TG SignPulse</span>
        </div>
        <div className="top-right-actions">
          <ThemeLanguageToggle />
          <a href="https://github.com" target="_blank" rel="noreferrer" className="action-btn" title="GitHub">
            <GithubLogo weight="bold" />
          </a>
          <Link href="/dashboard/settings" className="action-btn" title={t("sidebar_settings")}>
            <Gear weight="bold" />
          </Link>
        </div>
      </nav>

      <main className="main-content">
        {loading && accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner className="animate-spin mb-4" size={40} weight="bold" />
            <span className="text-main/50">{t("loading")}</span>
          </div>
        ) : (
          <div className="card-grid">
            {accounts.map((acc) => {
              const initial = acc.name.charAt(0).toUpperCase();
              return (
                <div
                  key={acc.name}
                  className="glass-panel card"
                  onClick={() => router.push(`/dashboard/account-tasks?name=${acc.name}`)}
                >
                  <div className="card-top">
                    <div className="account-name">
                      <div className="account-avatar">{initial}</div>
                      {acc.name}
                    </div>
                    <div className="task-badge">
                      {getAccountTaskCount(acc.name)} {t("sidebar_tasks")}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}></div>

                  <div className="card-bottom">
                    <div className="create-time">
                      <Clock weight="bold" />
                      <span>{t("connected")}</span>
                    </div>
                    <div className="card-actions">
                      <div
                        className="action-icon"
                        title={t("logs")}
                        onClick={(e) => { e.stopPropagation(); handleShowLogs(acc.name); }}
                      >
                        <ListDashes weight="bold" />
                      </div>
                      <div
                        className="action-icon delete"
                        title={t("remove")}
                        onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.name); }}
                      >
                        <Trash weight="bold" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 添加新账号卡片 */}
            <div
              className="card card-add"
              onClick={() => { setShowAddDialog(true); }}
            >
              <div className="add-icon-circle">
                <Plus weight="bold" />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-sub)' }}>{t("add_account")}</span>
            </div>
          </div>
        )}
      </main>

      {showAddDialog && (
        <div className="modal-overlay active" onClick={() => setShowAddDialog(false)}>
          <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{t("add_account")}</div>
              <div className="modal-close" onClick={() => setShowAddDialog(false)}><X weight="bold" /></div>
            </div>

            <div className="animate-float-up">
              <div>
                <label>{t("session_name")}</label>
                <input
                  type="text"
                  placeholder="e.g. Work_Account_01"
                  value={loginData.account_name}
                  onChange={(e) => setLoginData({ ...loginData, account_name: e.target.value })}
                />

                <label>{t("phone_number")}</label>
                <input
                  type="text"
                  placeholder="+86 138 0000 0000"
                  value={loginData.phone_number}
                  onChange={(e) => setLoginData({ ...loginData, phone_number: e.target.value })}
                />

                <label>{t("login_code")}</label>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder={t("login_code_placeholder")}
                    value={loginData.phone_code}
                    onChange={(e) => setLoginData({ ...loginData, phone_code: e.target.value })}
                  />
                  <button className="btn-code" onClick={handleStartLogin} disabled={loading} title={t("send_code")}>
                    {loading ? <Spinner className="animate-spin" size={18} /> : <PaperPlaneRight weight="bold" />}
                  </button>
                </div>

                <label>{t("two_step_pass")}</label>
                <input
                  type="password"
                  placeholder={t("two_step_placeholder")}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />

                <label>{t("proxy")}</label>
                <input
                  type="text"
                  placeholder={t("proxy_placeholder")}
                  style={{ marginBottom: 0 }}
                  value={loginData.proxy}
                  onChange={(e) => setLoginData({ ...loginData, proxy: e.target.value })}
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button className="btn-secondary flex-1" onClick={() => setShowAddDialog(false)}>{t("cancel")}</button>
                <button className="btn-gradient flex-1" onClick={handleVerifyLogin} disabled={loading}>
                  {loading ? <Spinner className="animate-spin" /> : t("confirm_connect")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogsDialog && (
        <div className="modal-overlay active" onClick={() => setShowLogsDialog(false)}>
          <div className="glass-panel modal-content !max-w-4xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="modal-header border-b border-white/10 pb-4 mb-0">
              <div className="modal-title flex items-center gap-3">
                <div className="p-2 bg-[#8a3ffc]/10 rounded-lg text-[#8a3ffc]">
                  <ListDashes weight="bold" size={20} />
                </div>
                <div className="font-bold text-xl">{logsAccountName} {t("running_logs")}</div>
              </div>
              <div className="modal-close" onClick={() => setShowLogsDialog(false)}><X weight="bold" /></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-black/20 custom-scrollbar mt-4 rounded-xl border border-white/10">
              {logsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-main/30">
                  <Spinner className="animate-spin mb-4" size={32} />
                  {t("loading")}
                </div>
              ) : accountLogs.length === 0 ? (
                <div className="text-center py-20 text-main/20">{t("no_logs")}</div>
              ) : (
                <div className="space-y-4">
                  {accountLogs.map((log, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex justify-between items-center mb-3 text-xs">
                        <span className="text-main/30">{new Date(log.created_at).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full ${log.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {log.success ? t("success") : t("failure")}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap text-main/70 leading-relaxed overflow-x-auto max-h-[200px] scrollbar-thin">
                        {log.message}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10 text-center bg-white/5 mt-4">
              <button className="btn-secondary px-10 mx-auto" onClick={() => setShowLogsDialog(false)}>
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
