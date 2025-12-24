"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../../lib/auth";
import {
    listAccounts,
    startAccountLogin,
    verifyAccountLogin,
    deleteAccount,
    AccountInfo,
    LoginStartRequest,
    LoginVerifyRequest,
} from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

export default function AccountsPage() {
    const router = useRouter();
    const [token, setLocalToken] = useState<string | null>(null);
    const [accounts, setAccounts] = useState<AccountInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // 添加账号对话框状态
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [loginStep, setLoginStep] = useState<"input" | "verify">("input");

    // 登录表单数据
    const [loginData, setLoginData] = useState({
        account_name: "",
        phone_number: "",
        proxy: "",
        phone_code: "",
        password: "", // 2FA密码
        phone_code_hash: "",
    });

    useEffect(() => {
        const t = getToken();
        if (!t) {
            router.replace("/");
            return;
        }
        setLocalToken(t);
        loadAccounts(t);
    }, [router]);

    const loadAccounts = async (t: string) => {
        try {
            setLoading(true);
            const data = await listAccounts(t);
            setAccounts(data.accounts);
        } catch (err: any) {
            setError(err.message || "加载账号列表失败");
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

            // 保存 phone_code_hash 用于后续验证
            setLoginData(prev => ({
                ...prev,
                phone_code_hash: result.phone_code_hash,
            }));

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
                // 重新加载账号列表
                await loadAccounts(token);
            }
        } catch (err: any) {
            setError(err.message || "登录验证失败");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async (accountName: string) => {
        if (!token) return;

        if (!confirm(`确定要删除账号 ${accountName} 吗？删除后无法恢复！`)) {
            return;
        }

        try {
            setLoading(true);
            setError("");

            await deleteAccount(token, accountName);
            setSuccess(`账号 ${accountName} 已删除`);

            // 重新加载账号列表
            await loadAccounts(token);
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
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                {/* 标题和添加按钮 */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">账号管理</h1>
                    <Button onClick={() => setShowAddDialog(true)}>
                        + 添加账号
                    </Button>
                </div>

                {/* 错误和成功提示 */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
                        {success}
                    </div>
                )}

                {/* 账号列表 */}
                <div className="grid gap-4">
                    {loading && accounts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">加载中...</div>
                    ) : accounts.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-gray-500">
                                暂无账号，点击"添加账号"开始添加
                            </CardContent>
                        </Card>
                    ) : (
                        accounts.map((account) => (
                            <Card key={account.name}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">📱</span>
                                            <span>{account.name}</span>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteAccount(account.name)}
                                            disabled={loading}
                                        >
                                            删除
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-500">Session 文件:</span>
                                            <div className="font-mono text-xs mt-1 break-all">
                                                {account.session_file}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">文件大小:</span>
                                            <div className="mt-1">
                                                {(account.size / 1024).toFixed(2)} KB
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* 添加账号对话框 */}
                {showAddDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <Card className="w-full max-w-md mx-4">
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
                                            <p className="text-xs text-gray-500 mt-1">
                                                用于标识账号，对应 session 文件名
                                            </p>
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
                )}
            </div>
        </div>
    );
}
