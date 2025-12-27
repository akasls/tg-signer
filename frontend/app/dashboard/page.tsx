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

export default function Dashboard() {
  const router = useRouter();
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



  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace("/");
      return;
    }
    setLocalToken(t);
    loadData(t);
  }, [router]);

  const loadData = async (t: string) => {
    try {
      setLoading(true);
      const [accountsData, tasksData] = await Promise.all([
        listAccounts(t),
        listSignTasks(t),
      ]);
      setAccounts(accountsData.accounts);
      setTasks(tasksData);
    } catch (err: any) {
      addToast(err.message || "加载数据失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const getAccountTaskCount = (accountName: string) => {
    // 根据任务的 account_name 筛选属于该账号的任务
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

      const request: LoginStartRequest = {
        account_name: loginData.account_name,
        phone_number: loginData.phone_number,
        proxy: loginData.proxy || undefined,
      };

      const result = await startAccountLogin(token, request);
      setLoginData(prev => ({ ...prev, phone_code_hash: result.phone_code_hash }));
      addToast(result.message, "success");
      setLoginStep("verify");
    } catch (err: any) {
      addToast(err.message || "发送验证码失败", "error");
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

      const request: LoginVerifyRequest = {
        account_name: loginData.account_name,
        phone_number: loginData.phone_number,
        phone_code: loginData.phone_code,
        phone_code_hash: loginData.phone_code_hash,
        password: loginData.password || undefined,
        proxy: loginData.proxy || undefined,
      };

      const result = await verifyAccountLogin(token, request);
      addToast(result.message, "success");
      setShowAddDialog(false);
      setLoginStep("input");
      setLoginData({
        account_name: "",
        phone_number: "",
        proxy: "",
        phone_code: "",
        password: "",
        phone_code_hash: "",
      });
      await loadData(token);
    } catch (err: any) {
      addToast(err.message || "验证登录失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountName: string) => {
    if (!token) return;

    if (!confirm(`确定要删除账号 ${accountName} 及其所有任务吗？此操作无法撤销！`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteAccount(token, accountName);
      addToast(`账号 ${accountName} 已删除`, "success");
      await loadData(token);
    } catch (err: any) {
      addToast(err.message || "删除账号失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleShowLogs = async (accountName: string) => {
    if (!token) return;
    setLogsAccountName(accountName);
    setShowLogsDialog(true);
    setLogsLoading(true);
    try {
      const logs = await getAccountLogs(token, accountName, 50);
      setAccountLogs(logs);
    } catch (err: any) {
      addToast(err.message || "获取日志失败", "error");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("确定要退出登录吗？")) {
      logout();
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* 动态流光背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] animate-glow-move"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[100px] animate-glow-move-reverse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[150px] animate-glow-pulse"></div>
      </div>

      {/* 导航栏 */}
      <nav className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：网站名称 */}
            <div className="flex items-center gap-3">
              <div className="text-2xl animate-pulse-glow rounded-full p-1">⚡</div>
              <h1 className="text-xl font-bold aurora-text">
                TG SignPulse
              </h1>
            </div>

            {/* 右侧：GitHub + 设置 */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/akasls/tg-signer"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white"
                title="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>

              <Link
                href="/dashboard/settings"
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white"
                title="设置"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>


      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-6 py-8 page-transition">
        {/* 账号列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading && accounts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="loading-spinner mb-4"></div>
              <span className="text-white/50">加载中...</span>
            </div>
          ) : (
            <>
              {accounts.map((account, index) => (
                <Link
                  key={account.name}
                  href={`/dashboard/account-tasks?name=${encodeURIComponent(account.name)}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  className="animate-fade-in-up opacity-0"
                >
                  <Card className="card-hover h-full cursor-pointer relative overflow-hidden">
                    <CardContent className="p-6 pb-14">
                      {/* 左上角：账号名称 */}
                      <div className="font-bold text-lg mb-4 text-white">{account.name}</div>

                      {/* 右上角：任务数量 */}
                      <div className="absolute top-6 right-6 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium border border-cyan-500/30">
                        {getAccountTaskCount(account.name)} 个任务
                      </div>

                      {/* 底部：时间和操作按钮对齐 */}
                      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
                        {/* 左下角：添加时间 */}
                        <div className="text-xs text-white/40">
                          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}
                        </div>

                        {/* 右下角：日志和删除按钮 - 始终显示 */}
                        <div className="flex gap-1">
                          {/* 日志按钮 */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleShowLogs(account.name);
                            }}
                            className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-all"
                            title="查看日志"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          {/* 删除按钮 */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteAccount(account.name);
                            }}
                            className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all"
                            title="删除账号"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </CardContent>

                    {/* 装饰性渐变 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none"></div>
                  </Card>
                </Link>
              ))}

              {/* 添加账号方块 */}
              <div
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${accounts.length * 0.1}s` }}
              >
                <Card
                  className="card-hover h-full cursor-pointer border-2 border-dashed border-white/20 hover:border-violet-500/50 transition-all bg-transparent hover:bg-white/5"
                  onClick={() => setShowAddDialog(true)}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[150px]">
                    <div className="text-4xl mb-2 text-white/50">+</div>
                    <div className="text-white/50 font-medium">添加账号</div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 添加账号对话框 */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {loginStep === "input" ? "添加 Telegram 账号" : "验证登录"}
              </h2>

              {loginStep === "input" ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="account_name">账号名称</Label>
                    <Input
                      id="account_name"
                      placeholder="例如: my_account"
                      value={loginData.account_name}
                      onChange={(e) => setLoginData({ ...loginData, account_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone_number">手机号</Label>
                    <Input
                      id="phone_number"
                      placeholder="+8613800138000"
                      value={loginData.phone_number}
                      onChange={(e) => setLoginData({ ...loginData, phone_number: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="proxy">代理（可选）</Label>
                    <Input
                      id="proxy"
                      placeholder="socks5://127.0.0.1:1080"
                      value={loginData.proxy}
                      onChange={(e) => setLoginData({ ...loginData, proxy: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => setShowAddDialog(false)}
                      className="flex-1"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleStartLogin}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? "发送中..." : "发送验证码"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phone_code">验证码</Label>
                    <Input
                      id="phone_code"
                      placeholder="输入收到的验证码"
                      value={loginData.phone_code}
                      onChange={(e) => setLoginData({ ...loginData, phone_code: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">2FA 密码（可选）</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="如果启用了两步验证，请输入密码"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setLoginStep("input");
                        setLoginData({ ...loginData, phone_code: "", password: "" });
                      }}
                      className="flex-1"
                    >
                      返回
                    </Button>
                    <Button
                      onClick={handleVerifyLogin}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? "验证中..." : "验证登录"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
      }

      {/* 日志弹窗 */}
      {
        showLogsDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">账号日志 - {logsAccountName}</h2>
                  <button
                    onClick={() => setShowLogsDialog(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {logsLoading ? (
                    <div className="text-center py-8 text-gray-500">加载中...</div>
                  ) : accountLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">暂无日志记录</div>
                  ) : (
                    <div className="space-y-2">
                      {accountLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-3 rounded-lg border ${log.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{log.task_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.created_at).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <div className={`text-sm ${log.success ? 'text-green-700' : 'text-red-700'}`}>
                            {log.success ? '✓' : '✗'} {log.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <Button
                    variant="secondary"
                    onClick={() => setShowLogsDialog(false)}
                    className="w-full"
                  >
                    关闭
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* Toast 通知容器 */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div >
  );
}

