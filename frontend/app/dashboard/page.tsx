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
  fetchTasks,
  AccountInfo,
  LoginStartRequest,
  LoginVerifyRequest,
} from "../../lib/api";
import { Task } from "../../lib/types";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function Dashboard() {
  const router = useRouter();
  const [token, setLocalToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        fetchTasks(t),
      ]);
      setAccounts(accountsData.accounts);
      setTasks(tasksData);
    } catch (err: any) {
      setError(err.message || "加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleStartLogin = async () => {
    if (!token) return;

    if (!loginData.account_name || !loginData.phone_number) {
      setError("请填写账号名称和手机号");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const request: LoginStartRequest = {
        account_name: loginData.account_name,
        phone_number: loginData.phone_number,
        proxy: loginData.proxy || undefined,
      };

      const result = await startAccountLogin(token, request);
      setLoginData(prev => ({ ...prev, phone_code_hash: result.phone_code_hash }));
      setSuccess(result.message);
      setLoginStep("verify");
    } catch (err: any) {
      setError(err.message || "发送验证码失败");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLogin = async () => {
    if (!token) return;

    if (!loginData.phone_code) {
      setError("请输入验证码");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const request: LoginVerifyRequest = {
        account_name: loginData.account_name,
        phone_number: loginData.phone_number,
        phone_code: loginData.phone_code,
        phone_code_hash: loginData.phone_code_hash,
        password: loginData.password || undefined,
        proxy: loginData.proxy || undefined,
      };

      const result = await verifyAccountLogin(token, request);

      if (result.success) {
        setSuccess(`登录成功！欢迎 ${result.first_name || result.username}`);
        resetDialog();
        await loadData(token);
      }
    } catch (err: any) {
      setError(err.message || "登录验证失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountName: string) => {
    if (!token) return;

    if (!confirm(`确定要删除账号 ${accountName} 吗？`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteAccount(token, accountName);
      setSuccess(`账号 ${accountName} 已删除`);
      await loadData(token);
    } catch (err: any) {
      setError(err.message || "删除账号失败");
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
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
    setError("");
    setSuccess("");
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">tg-signer 控制台</h1>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings">
              <Button variant="secondary">⚙️ 设置</Button>
            </Link>
            <Button variant="secondary" onClick={logout}>
              退出
            </Button>
          </div>
        </div>

        {/* 错误和成功提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
            <button onClick={() => setError("")} className="ml-2 font-bold">×</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
            {success}
            <button onClick={() => setSuccess("")} className="ml-2 font-bold">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 账号列表 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>📱 账号管理</CardTitle>
                <Button onClick={() => setShowAddDialog(true)} size="sm">
                  + 添加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && accounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无账号，点击"添加"开始
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div
                      key={account.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-xs text-gray-500">
                          {(account.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteAccount(account.name)}
                        disabled={loading}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 任务列表 */}
          <Card>
            <CardHeader>
              <CardTitle>⚡ 任务管理</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  暂无任务
                  <div className="text-xs mt-2">
                    使用 CLI 命令配置任务
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-gray-50 rounded"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium">{task.name}</div>
                        <div className={`text-xs px-2 py-1 rounded ${task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {task.enabled ? '已启用' : '已禁用'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        CRON: {task.cron}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 添加账号弹窗 */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  {loginStep === "input" ? "添加 Telegram 账号" : "验证登录"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loginStep === "input" ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="account_name">账号名称</Label>
                      <Input
                        id="account_name"
                        placeholder="例如: my_account"
                        value={loginData.account_name}
                        onChange={(e) =>
                          setLoginData({ ...loginData, account_name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone_number">手机号</Label>
                      <Input
                        id="phone_number"
                        placeholder="+8613800138000"
                        value={loginData.phone_number}
                        onChange={(e) =>
                          setLoginData({ ...loginData, phone_number: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        国际格式，如 +86 开头
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="proxy">代理（可选）</Label>
                      <Input
                        id="proxy"
                        placeholder="socks5://127.0.0.1:1080"
                        value={loginData.proxy}
                        onChange={(e) =>
                          setLoginData({ ...loginData, proxy: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={resetDialog} className="flex-1">
                        取消
                      </Button>
                      <Button onClick={handleStartLogin} disabled={loading} className="flex-1">
                        {loading ? "发送中..." : "发送验证码"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                      验证码已发送到 {loginData.phone_number}
                    </div>

                    <div>
                      <Label htmlFor="phone_code">验证码</Label>
                      <Input
                        id="phone_code"
                        placeholder="输入收到的验证码"
                        value={loginData.phone_code}
                        onChange={(e) =>
                          setLoginData({ ...loginData, phone_code: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">2FA 密码（可选）</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="如果启用了两步验证，请输入密码"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={resetDialog} className="flex-1">
                        取消
                      </Button>
                      <Button onClick={handleVerifyLogin} disabled={loading} className="flex-1">
                        {loading ? "验证中..." : "验证登录"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
