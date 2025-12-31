"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "../../../lib/auth";
import {
    changePassword,
    changeUsername,
    getTOTPStatus,
    setupTOTP,
    getTOTPQRCode,
    enableTOTP,
    disableTOTP,
    exportAllConfigs,
    importAllConfigs,
    getAIConfig,
    saveAIConfig,
    testAIConnection,
    deleteAIConfig,
    AIConfig,
    getGlobalSettings,
    saveGlobalSettings,
    GlobalSettings,
    getTelegramConfig,
    saveTelegramConfig,
    resetTelegramConfig,
    TelegramConfig,
} from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { ToastContainer, useToast } from "../../../components/ui/toast";

export default function SettingsPage() {
    const router = useRouter();
    const { toasts, addToast, removeToast } = useToast();
    const [token, setLocalToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // 用户名修改
    const [usernameForm, setUsernameForm] = useState({
        newUsername: "",
        password: "",
    });

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

    // AI 配置
    const [aiConfig, setAIConfig] = useState<AIConfig | null>(null);
    const [aiForm, setAIForm] = useState({
        api_key: "",
        base_url: "",
        model: "gpt-4o",
    });
    const [aiTestResult, setAITestResult] = useState<string | null>(null);
    const [aiTesting, setAITesting] = useState(false);

    // 全局设置
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ sign_interval: null, log_retention_days: 7 });

    // Telegram API 配置
    const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(null);
    const [telegramForm, setTelegramForm] = useState({
        api_id: "",
        api_hash: "",
    });

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const t = getToken();
        if (!t) {
            router.replace("/");
            return;
        }
        setLocalToken(t);
        loadTOTPStatus(t);
        loadAIConfig(t);
        loadGlobalSettings(t);
        loadTelegramConfig(t);
    }, [mounted, router]);

    const loadTOTPStatus = async (t: string) => {
        try {
            const status = await getTOTPStatus(t);
            setTotpEnabled(status.enabled);
        } catch (err: any) {
            console.error("加载2FA状态失败:", err);
        }
    };

    const loadAIConfig = async (t: string) => {
        try {
            const config = await getAIConfig(t);
            setAIConfig(config);
            if (config.has_config) {
                setAIForm({
                    api_key: "",  // 不回填密钥
                    base_url: config.base_url || "",
                    model: config.model || "gpt-4o",
                });
            }
        } catch (err: any) {
            console.error("加载AI配置失败:", err);
        }
    };

    const loadGlobalSettings = async (t: string) => {
        try {
            const settings = await getGlobalSettings(t);
            setGlobalSettings(settings);
        } catch (err: any) {
            console.error("加载全局设置失败:", err);
        }
    };

    const loadTelegramConfig = async (t: string) => {
        try {
            const config = await getTelegramConfig(t);
            setTelegramConfig(config);
            setTelegramForm({
                api_id: config.api_id,
                api_hash: config.api_hash,
            });
        } catch (err: any) {
            console.error("加载 Telegram API 配置失败:", err);
        }
    };

    const handleSaveTelegramConfig = async () => {
        if (!token) return;

        if (!telegramForm.api_id || !telegramForm.api_hash) {
            addToast("API ID 和 API Hash 不能为空", "error");
            return;
        }

        try {
            setLoading(true);

            await saveTelegramConfig(token, telegramForm);
            addToast("Telegram API 配置已保存", "success");
            loadTelegramConfig(token);
        } catch (err: any) {
            addToast(err.message || "保存 Telegram API 配置失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleResetTelegramConfig = async () => {
        if (!token) return;

        if (!confirm("确定要重置为默认配置吗？")) {
            return;
        }

        try {
            setLoading(true);

            await resetTelegramConfig(token);
            addToast("Telegram API 配置已重置为默认值", "success");
            loadTelegramConfig(token);
        } catch (err: any) {
            addToast(err.message || "重置 Telegram API 配置失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGlobalSettings = async () => {
        if (!token) return;

        try {
            setLoading(true);

            await saveGlobalSettings(token, globalSettings);
            addToast("全局设置已保存", "success");
        } catch (err: any) {
            addToast(err.message || "保存全局设置失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!token) return;

        if (!passwordForm.oldPassword || !passwordForm.newPassword) {
            addToast("请填写所有密码字段", "error");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            addToast("新密码和确认密码不一致", "error");
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            addToast("新密码长度至少为 6 个字符", "error");
            return;
        }

        try {
            setLoading(true);

            const result = await changePassword(
                token,
                passwordForm.oldPassword,
                passwordForm.newPassword
            );

            addToast(result.message, "success");
            setPasswordForm({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err: any) {
            addToast(err.message || "修改密码失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChangeUsername = async () => {
        if (!token) return;

        if (!usernameForm.newUsername || !usernameForm.password) {
            addToast("请填写新用户名和密码", "error");
            return;
        }

        if (usernameForm.newUsername.length < 3) {
            addToast("用户名长度至少为 3 个字符", "error");
            return;
        }

        try {
            setLoading(true);

            const result = await changeUsername(
                token,
                usernameForm.newUsername,
                usernameForm.password
            );

            addToast(result.message, "success");
            setUsernameForm({
                newUsername: "",
                password: "",
            });
        } catch (err: any) {
            addToast(err.message || "修改用户名失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSetupTOTP = async () => {
        if (!token) return;

        try {
            setLoading(true);

            const result = await setupTOTP(token);
            setTotpSecret(result.secret);
            setShowTotpSetup(true);
            addToast("2FA 密钥已生成，请扫描二维码", "success");
        } catch (err: any) {
            addToast(err.message || "设置2FA失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEnableTOTP = async () => {
        if (!token) return;

        if (!totpCode) {
            addToast("请输入验证码", "error");
            return;
        }

        try {
            setLoading(true);

            const result = await enableTOTP(token, totpCode);
            addToast(result.message, "success");
            setTotpEnabled(true);
            setShowTotpSetup(false);
            setTotpCode("");
            setTotpSecret("");
        } catch (err: any) {
            addToast(err.message || "启用2FA失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDisableTOTP = async () => {
        if (!token) return;

        if (!totpCode) {
            addToast("请输入验证码", "error");
            return;
        }

        if (!confirm("确定要禁用两步验证吗？")) {
            return;
        }

        try {
            setLoading(true);

            const result = await disableTOTP(token, totpCode);
            addToast(result.message, "success");
            setTotpEnabled(false);
            setTotpCode("");
        } catch (err: any) {
            addToast(err.message || "禁用2FA失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExportConfig = async () => {
        if (!token) return;

        try {
            setLoading(true);

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

            addToast("配置已导出", "success");
        } catch (err: any) {
            addToast(err.message || "导出配置失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleImportConfig = async () => {
        if (!token) return;

        if (!importConfig) {
            addToast("请粘贴配置 JSON", "error");
            return;
        }

        try {
            setLoading(true);

            const result = await importAllConfigs(token, importConfig, overwriteConfig);
            addToast(result.message, "success");
            setImportConfig("");
        } catch (err: any) {
            addToast(err.message || "导入配置失败", "error");
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

    // AI 配置处理函数
    const handleSaveAIConfig = async () => {
        if (!token) return;

        if (!aiForm.api_key) {
            addToast("请输入 API Key", "error");
            return;
        }

        try {
            setLoading(true);

            await saveAIConfig(token, {
                api_key: aiForm.api_key,
                base_url: aiForm.base_url || undefined,
                model: aiForm.model || undefined,
            });

            addToast("AI 配置已保存", "success");
            loadAIConfig(token);
            setAIForm({ ...aiForm, api_key: "" });  // 清空密钥输入
        } catch (err: any) {
            addToast(err.message || "保存 AI 配置失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleTestAIConnection = async () => {
        if (!token) return;

        try {
            setAITesting(true);
            setAITestResult(null);

            const result = await testAIConnection(token);

            if (result.success) {
                setAITestResult(`✅ ${result.message}`);
            } else {
                setAITestResult(`❌ ${result.message}`);
            }
        } catch (err: any) {
            setAITestResult(`❌ 测试失败: ${err.message}`);
        } finally {
            setAITesting(false);
        }
    };

    const handleDeleteAIConfig = async () => {
        if (!token) return;

        if (!confirm("确定要删除 AI 配置吗？")) {
            return;
        }

        try {
            setLoading(true);

            await deleteAIConfig(token);
            addToast("AI 配置已删除", "success");
            setAIConfig(null);
            setAIForm({
                api_key: "",
                base_url: "",
                model: "gpt-4o",
            });
            setAITestResult(null);
        } catch (err: any) {
            addToast(err.message || "删除 AI 配置失败", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return null;
    }

    const handleLogout = () => {
        if (confirm("确定要退出登录吗？")) {
            localStorage.removeItem("tg-signer-token");
            router.push("/");
        }
    };

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
                        {/* 左边：返回箭头 + 面包屑 */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white"
                                title="返回主页"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-2 text-sm">
                                <button onClick={() => router.push("/dashboard")} className="text-white/50 hover:text-white transition-colors">
                                    首页
                                </button>
                                <span className="text-white/30">/</span>
                                <span className="text-white font-medium">设置</span>
                            </div>
                        </div>

                        {/* 右边：退出登录图标 */}
                        <button
                            onClick={handleLogout}
                            className="p-2.5 hover:bg-rose-500/20 rounded-xl transition-all text-rose-400 hover:text-rose-300"
                            title="退出登录"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="p-6 pb-20 relative z-10 page-transition">
                <div className="max-w-4xl mx-auto space-y-4">

                    {/* 任务相关设置区块 */}
                    <div className="grid gap-4">

                        {/* 任务间隔 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>任务间隔</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="signInterval">任务间隔（秒）</Label>
                                    <Input
                                        id="signInterval"
                                        type="number"
                                        placeholder="留空使用随机 1-120 秒"
                                        value={globalSettings.sign_interval ?? ""}
                                        onChange={(e) => setGlobalSettings({
                                            ...globalSettings,
                                            sign_interval: e.target.value ? parseInt(e.target.value) : null
                                        })}
                                    />
                                    <p className="text-xs text-white/50 mt-1">
                                        执行多个任务时，每个任务之间的等待时间。留空则随机 1-120 秒
                                    </p>
                                </div>

                                <Button onClick={handleSaveGlobalSettings} disabled={loading}>
                                    {loading ? "保存中..." : "保存设置"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Telegram API 配置 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Telegram API 配置</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">配置状态</p>
                                        <p className="text-sm text-white/50">
                                            {telegramConfig?.is_custom ? "✅ 自定义配置" : "📋 使用默认配置"}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 bg-white/5 rounded text-sm space-y-1">
                                    <p><span className="text-white/50">当前 API ID:</span> {telegramForm.api_id}</p>
                                    <p><span className="text-white/50">当前 API Hash:</span> {telegramForm.api_hash.substring(0, 8)}...{telegramForm.api_hash.substring(telegramForm.api_hash.length - 4)}</p>
                                    {telegramConfig && !telegramConfig.is_custom && (
                                        <p className="text-amber-400/80 text-xs mt-2">
                                            ℹ️ 当前使用内置默认配置，您可以设置自己的 API 凭证
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3 p-4 bg-white/5 rounded">
                                    <p className="font-medium text-sm text-white">
                                        {telegramConfig?.is_custom ? "更新配置" : "设置自定义配置"}
                                    </p>
                                    <p className="text-xs text-white/50">
                                        从 <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">my.telegram.org</a> 获取您自己的 API 凭证
                                    </p>

                                    <div>
                                        <Label htmlFor="tgApiId">API ID *</Label>
                                        <Input
                                            id="tgApiId"
                                            placeholder={telegramConfig?.default_api_id || "123456"}
                                            value={telegramForm.api_id}
                                            onChange={(e) => setTelegramForm({ ...telegramForm, api_id: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="tgApiHash">API Hash *</Label>
                                        <Input
                                            id="tgApiHash"
                                            placeholder={telegramConfig?.default_api_hash ? telegramConfig.default_api_hash.substring(0, 8) + "..." : "abc...xyz"}
                                            value={telegramForm.api_hash}
                                            onChange={(e) => setTelegramForm({ ...telegramForm, api_hash: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={handleSaveTelegramConfig} disabled={loading}>
                                            {loading ? "保存中..." : "保存配置"}
                                        </Button>
                                        {telegramConfig?.is_custom && (
                                            <Button
                                                variant="secondary"
                                                onClick={handleResetTelegramConfig}
                                                disabled={loading}
                                            >
                                                恢复默认
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI 配置 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>AI 配置</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">配置状态</p>
                                        <p className="text-sm text-white/50">
                                            {aiConfig?.has_config ? "✅ 已配置" : "❌ 未配置"}
                                        </p>
                                    </div>
                                </div>

                                {aiConfig?.has_config && (
                                    <div className="p-3 bg-white/5 rounded text-sm">
                                        <p><span className="text-white/50">API Key:</span> {aiConfig.api_key_masked}</p>
                                        {aiConfig.base_url && (
                                            <p><span className="text-white/50">Base URL:</span> {aiConfig.base_url}</p>
                                        )}
                                        {aiConfig.model && (
                                            <p><span className="text-white/50">Model:</span> {aiConfig.model}</p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-3 p-4 bg-white/5 rounded">
                                    <p className="font-medium text-sm text-white">
                                        {aiConfig?.has_config ? "更新配置" : "添加配置"}
                                    </p>
                                    <p className="text-xs text-white/50">
                                        用于 AI 图片识别和 AI 计算题功能，需要 OpenAI 兼容的 API
                                    </p>

                                    <div>
                                        <Label htmlFor="aiApiKey">API Key *</Label>
                                        <Input
                                            id="aiApiKey"
                                            type="password"
                                            placeholder="sk-..."
                                            value={aiForm.api_key}
                                            onChange={(e) => setAIForm({ ...aiForm, api_key: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="aiBaseUrl">Base URL（可选）</Label>
                                        <Input
                                            id="aiBaseUrl"
                                            placeholder="https://api.openai.com/v1"
                                            value={aiForm.base_url}
                                            onChange={(e) => setAIForm({ ...aiForm, base_url: e.target.value })}
                                        />
                                        <p className="text-xs text-white/50 mt-1">
                                            留空使用 OpenAI 官方地址，可填写兼容 API 地址
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="aiModel">Model（可选）</Label>
                                        <Input
                                            id="aiModel"
                                            placeholder="gpt-4o"
                                            value={aiForm.model}
                                            onChange={(e) => setAIForm({ ...aiForm, model: e.target.value })}
                                        />
                                        <p className="text-xs text-white/50 mt-1">
                                            默认 gpt-4o，图片识别需要支持 vision 的模型
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={handleSaveAIConfig} disabled={loading}>
                                            {loading ? "保存中..." : "保存配置"}
                                        </Button>
                                        {aiConfig?.has_config && (
                                            <>
                                                <Button
                                                    variant="secondary"
                                                    onClick={handleTestAIConnection}
                                                    disabled={aiTesting}
                                                >
                                                    {aiTesting ? "测试中..." : "测试连接"}
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDeleteAIConfig}
                                                    disabled={loading}
                                                >
                                                    删除配置
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    {aiTestResult && (
                                        <div className={`p-3 rounded text-sm ${aiTestResult.startsWith("✅")
                                            ? "bg-green-50 text-green-700 border border-green-200"
                                            : "bg-red-50 text-red-700 border border-red-200"
                                            }`}>
                                            {aiTestResult}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 系统相关设置区块 */}
                    <div className="grid gap-4">

                        {/* 修改用户名 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>修改用户名</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="newUsername">新用户名</Label>
                                    <Input
                                        id="newUsername"
                                        placeholder="输入新用户名"
                                        value={usernameForm.newUsername}
                                        onChange={(e) =>
                                            setUsernameForm({ ...usernameForm, newUsername: e.target.value })
                                        }
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="usernamePassword">确认密码</Label>
                                    <Input
                                        id="usernamePassword"
                                        type="password"
                                        placeholder="输入当前密码确认"
                                        value={usernameForm.password}
                                        onChange={(e) =>
                                            setUsernameForm({ ...usernameForm, password: e.target.value })
                                        }
                                    />
                                </div>

                                <Button onClick={handleChangeUsername} disabled={loading}>
                                    {loading ? "修改中..." : "修改用户名"}
                                </Button>
                            </CardContent>
                        </Card>

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
                                        <p className="text-sm text-white/50">
                                            {totpEnabled ? "✅ 已启用" : "❌ 未启用"}
                                        </p>
                                    </div>
                                    {!totpEnabled && !showTotpSetup && (
                                        <Button onClick={handleSetupTOTP} disabled={loading}>
                                            启用 2FA
                                        </Button>
                                    )}
                                </div>

                                {showTotpSetup && totpSecret && token && (
                                    <div className="space-y-4 p-4 bg-white/5 rounded">
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
                                    <div className="space-y-4 p-4 bg-white/5 rounded">
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

                        {/* 日志保留天数 */}
                        <Card>
                            <CardHeader>
                                <CardTitle>日志设置</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="logRetentionDays">日志保留天数</Label>
                                    <Input
                                        id="logRetentionDays"
                                        type="number"
                                        value={globalSettings.log_retention_days ?? 7}
                                        onChange={(e) => setGlobalSettings({
                                            ...globalSettings,
                                            log_retention_days: parseInt(e.target.value) || 7
                                        })}
                                    />
                                    <p className="text-xs text-white/50 mt-1">
                                        超过保留天数的日志将被自动清理，默认保留 7 天
                                    </p>
                                </div>

                                <Button onClick={handleSaveGlobalSettings} disabled={loading}>
                                    {loading ? "保存中..." : "保存日志设置"}
                                </Button>
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
                                    <p className="text-sm text-white/50 mb-3">
                                        导出所有任务配置，用于备份或迁移
                                    </p>
                                    <Button onClick={handleExportConfig} disabled={loading}>
                                        {loading ? "导出中..." : "导出所有配置"}
                                    </Button>
                                </div>

                                <hr />

                                <div>
                                    <p className="font-medium mb-2">导入配置</p>
                                    <p className="text-sm text-white/50 mb-3">
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
            </div>

            {/* Toast 通知容器 */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
