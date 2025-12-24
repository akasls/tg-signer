"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../../lib/auth";
import {
    changePassword,
    getTOTPStatus,
    setupTOTP,
    getTOTPQRCode,
    enableTOTP,
    disableTOTP,
    exportAllConfigs,
    importAllConfigs,
} from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

export default function SettingsPage() {
    const router = useRouter();
    const [token, setLocalToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // 密码修改
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // 2FA 状态
    const [totpEnabled, setTotpEnabled] = useState(false);
    const [totpSecret, setTotpSecret] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [showTotpSetup, setShowTotpSetup] = useState(false);

    // 配置导入导出
    const [importConfig, setImportConfig] = useState("");
    const [overwriteConfig, setOverwriteConfig] = useState(false);

    useEffect(() => {
        const t = getToken();
        if (!t) {
            router.replace("/");
            return;
        }
        setLocalToken(t);
        loadTOTPStatus(t);
    }, [router]);

    const loadTOTPStatus = async (t: string) => {
        try {
            const status = await getTOTPStatus(t);
            setTotpEnabled(status.enabled);
        } catch (err: any) {
            console.error("加载2FA状态失败:", err);
        }
    };

    const handleChangePassword = async () => {
        if (!token) return;

        if (!passwordForm.oldPassword || !passwordForm.newPassword) {
            setError("请填写所有密码字段");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("新密码和确认密码不一致");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setError("新密码长度至少为 6 个字符");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const result = await changePassword(
                token,
                passwordForm.oldPassword,
                passwordForm.newPassword
            );

            setSuccess(result.message);
            setPasswordForm({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err: any) {
            setError(err.message || "修改密码失败");
        } finally {
            setLoading(false);
        }
    };

    const handleSetupTOTP = async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError("");

            const result = await setupTOTP(token);
            setTotpSecret(result.secret);
            setShowTotpSetup(true);
            setSuccess("2FA 密钥已生成，请扫描二维码");
        } catch (err: any) {
            setError(err.message || "设置2FA失败");
        } finally {
            setLoading(false);
        }
    };

    const handleEnableTOTP = async () => {
        if (!token) return;

        if (!totpCode) {
            setError("请输入验证码");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const result = await enableTOTP(token, totpCode);
            setSuccess(result.message);
            setTotpEnabled(true);
            setShowTotpSetup(false);
            setTotpCode("");
            setTotpSecret("");
        } catch (err: any) {
            setError(err.message || "启用2FA失败");
        } finally {
            setLoading(false);
        }
    };

    const handleDisableTOTP = async () => {
        if (!token) return;

        if (!totpCode) {
            setError("请输入验证码");
            return;
        }

        if (!confirm("确定要禁用两步验证吗？")) {
            return;
        }

        try {
            setLoading(true);
            setError("");

            const result = await disableTOTP(token, totpCode);
            setSuccess(result.message);
            setTotpEnabled(false);
            setTotpCode("");
        } catch (err: any) {
            setError(err.message || "禁用2FA失败");
        } finally {
            setLoading(false);
        }
    };

    const handleExportConfig = async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError("");

            const configJson = await exportAllConfigs(token);

            // 下载文件
            const blob = new Blob([configJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tg-signer-config-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setSuccess("配置已导出");
        } catch (err: any) {
            setError(err.message || "导出配置失败");
        } finally {
            setLoading(false);
        }
    };

    const handleImportConfig = async () => {
        if (!token) return;

        if (!importConfig) {
            setError("请粘贴配置 JSON");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const result = await importAllConfigs(token, importConfig, overwriteConfig);
            setSuccess(result.message);
            setImportConfig("");
        } catch (err: any) {
            setError(err.message || "导入配置失败");
        } finally {
            setLoading(false);
        }
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setImportConfig(content);
        };
        reader.readAsText(file);
    };

    if (!token) {
        return null;
    }

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">设置</h1>

                {/* 错误和成功提示 */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700">
                        {success}
                    </div>
                )}

                {/* 修改密码 */}
                <Card>
                    <CardHeader>
                        <CardTitle>修改密码</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="oldPassword">旧密码</Label>
                            <Input
                                id="oldPassword"
                                type="password"
                                value={passwordForm.oldPassword}
                                onChange={(e) =>
                                    setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <Label htmlFor="newPassword">新密码</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) =>
                                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">确认新密码</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) =>
                                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                                }
                            />
                        </div>

                        <Button onClick={handleChangePassword} disabled={loading}>
                            {loading ? "修改中..." : "修改密码"}
                        </Button>
                    </CardContent>
                </Card>

                {/* 两步验证 */}
                <Card>
                    <CardHeader>
                        <CardTitle>两步验证 (2FA)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">状态</p>
                                <p className="text-sm text-gray-500">
                                    {totpEnabled ? "✅ 已启用" : "❌ 未启用"}
                                </p>
                            </div>
                            {!totpEnabled && !showTotpSetup && (
                                <Button onClick={handleSetupTOTP} disabled={loading}>
                                    启用 2FA
                                </Button>
                            )}
                        </div>

                        {showTotpSetup && totpSecret && (
                            <div className="space-y-4 p-4 bg-gray-50 rounded">
                                <div>
                                    <p className="font-medium mb-2">1. 扫描二维码</p>
                                    <img
                                        src={getTOTPQRCode(token)}
                                        alt="2FA QR Code"
                                        className="w-48 h-48 border rounded"
                                    />
                                </div>

                                <div>
                                    <p className="font-medium mb-2">2. 或手动输入密钥</p>
                                    <code className="block p-2 bg-white border rounded text-sm break-all">
                                        {totpSecret}
                                    </code>
                                </div>

                                <div>
                                    <Label htmlFor="totpCode">3. 输入验证码</Label>
                                    <Input
                                        id="totpCode"
                                        placeholder="输入 6 位验证码"
                                        value={totpCode}
                                        onChange={(e) => setTotpCode(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            setShowTotpSetup(false);
                                            setTotpSecret("");
                                            setTotpCode("");
                                        }}
                                    >
                                        取消
                                    </Button>
                                    <Button onClick={handleEnableTOTP} disabled={loading}>
                                        {loading ? "验证中..." : "确认启用"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {totpEnabled && (
                            <div className="space-y-4 p-4 bg-gray-50 rounded">
                                <p className="text-sm text-gray-600">
                                    如需禁用两步验证，请输入验证码确认
                                </p>
                                <div>
                                    <Label htmlFor="disableTotpCode">验证码</Label>
                                    <Input
                                        id="disableTotpCode"
                                        placeholder="输入 6 位验证码"
                                        value={totpCode}
                                        onChange={(e) => setTotpCode(e.target.value)}
                                    />
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleDisableTOTP}
                                    disabled={loading}
                                >
                                    {loading ? "禁用中..." : "禁用 2FA"}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 配置管理 */}
                <Card>
                    <CardHeader>
                        <CardTitle>配置管理</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-medium mb-2">导出配置</p>
                            <p className="text-sm text-gray-500 mb-3">
                                导出所有任务配置，用于备份或迁移
                            </p>
                            <Button onClick={handleExportConfig} disabled={loading}>
                                {loading ? "导出中..." : "导出所有配置"}
                            </Button>
                        </div>

                        <hr />

                        <div>
                            <p className="font-medium mb-2">导入配置</p>
                            <p className="text-sm text-gray-500 mb-3">
                                从备份文件恢复配置
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="importFile">选择配置文件</Label>
                                    <Input
                                        id="importFile"
                                        type="file"
                                        accept=".json"
                                        onChange={handleImportFile}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="importConfig">或粘贴配置 JSON</Label>
                                    <textarea
                                        id="importConfig"
                                        className="w-full h-32 p-2 border rounded font-mono text-sm"
                                        placeholder='{"signs": {...}, "monitors": {...}}'
                                        value={importConfig}
                                        onChange={(e) => setImportConfig(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="overwrite"
                                        checked={overwriteConfig}
                                        onChange={(e) => setOverwriteConfig(e.target.checked)}
                                    />
                                    <Label htmlFor="overwrite" className="cursor-pointer">
                                        覆盖已存在的配置
                                    </Label>
                                </div>

                                <Button onClick={handleImportConfig} disabled={loading}>
                                    {loading ? "导入中..." : "导入配置"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
