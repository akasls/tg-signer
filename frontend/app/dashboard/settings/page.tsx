"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
    CaretLeft,
    User,
    Lock,
    ShieldCheck,
    Robot,
    Gear,
    Cpu,
    DownloadSimple,
    SignOut,
    Spinner,
    ArrowUDownLeft,
    FloppyDisk,
    WarningCircle,
    Trash,
    Robot as BotIcon
} from "@phosphor-icons/react";
import { ToastContainer, useToast } from "../../../components/ui/toast";
import { ThemeLanguageToggle } from "../../../components/ThemeLanguageToggle";
import { useLanguage } from "../../../context/LanguageContext";

export default function SettingsPage() {
    const router = useRouter();
    const { t } = useLanguage();
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
    const [aiConfig, setAIConfigState] = useState<AIConfig | null>(null);
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

    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const tokenStr = getToken();
        if (!tokenStr) {
            window.location.replace("/");
            return;
        }
        setLocalToken(tokenStr);
        setChecking(false);
        loadTOTPStatus(tokenStr);
        loadAIConfig(tokenStr);
        loadGlobalSettings(tokenStr);
        loadTelegramConfig(tokenStr);
    }, []);

    const loadTOTPStatus = async (tokenStr: string) => {
        try {
            const res = await getTOTPStatus(tokenStr);
            setTotpEnabled(res.enabled);
        } catch (err) { }
    };

    const loadAIConfig = async (tokenStr: string) => {
        try {
            const config = await getAIConfig(tokenStr);
            setAIConfigState(config);
            if (config) {
                setAIForm({
                    api_key: "", // 不回填密钥
                    base_url: config.base_url || "",
                    model: config.model || "gpt-4o",
                });
            }
        } catch (err) { }
    };

    const loadGlobalSettings = async (tokenStr: string) => {
        try {
            const settings = await getGlobalSettings(tokenStr);
            setGlobalSettings(settings);
        } catch (err) { }
    };

    const loadTelegramConfig = async (tokenStr: string) => {
        try {
            const config = await getTelegramConfig(tokenStr);
            setTelegramConfig(config);
            if (config) {
                setTelegramForm({
                    api_id: config.api_id?.toString() || "",
                    api_hash: config.api_hash || "",
                });
            }
        } catch (err) { }
    };

    const handleChangeUsername = async () => {
        if (!token) return;
        if (!usernameForm.newUsername || !usernameForm.password) {
            addToast("请填写完整信息", "error");
            return;
        }
        try {
            setLoading(true);
            const res = await changeUsername(token, usernameForm.newUsername, usernameForm.password);
            addToast("用户名修改成功", "success");
            if (res.access_token) {
                localStorage.setItem("tg-signer-token", res.access_token);
                setLocalToken(res.access_token);
            }
            setUsernameForm({ newUsername: "", password: "" });
        } catch (err: any) {
            addToast(err.message || "修改失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!token) return;
        if (!passwordForm.oldPassword || !passwordForm.newPassword) {
            addToast("请填写完整信息", "error");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            addToast("两次输入的密码不一致", "error");
            return;
        }
        try {
            setLoading(true);
            await changePassword(token, passwordForm.oldPassword, passwordForm.newPassword);
            addToast("密码修改成功", "success");
            setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            addToast(err.message || "修改失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSetupTOTP = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await setupTOTP(token);
            setTotpSecret(res.secret);
            setShowTotpSetup(true);
        } catch (err: any) {
            addToast(err.message || "准备失败", "error");
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
            await enableTOTP(token, totpCode);
            addToast("两步验证已启用", "success");
            setTotpEnabled(true);
            setShowTotpSetup(false);
            setTotpCode("");
        } catch (err: any) {
            addToast(err.message || "启用失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDisableTOTP = async () => {
        if (!token) return;
        const code = prompt("请输入两步验证码以停用：");
        if (!code) return;
        try {
            setLoading(true);
            await disableTOTP(token, code);
            addToast("两步验证已停用", "success");
            setTotpEnabled(false);
        } catch (err: any) {
            addToast(err.message || "停用失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const config = await exportAllConfigs(token);
            const blob = new Blob([config], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "tg-signer-config.json";
            a.click();
            addToast("配置导出成功", "success");
        } catch (err: any) {
            addToast(err.message || "导出失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!token) return;
        if (!importConfig) {
            addToast("请粘贴配置内容", "error");
            return;
        }
        try {
            setLoading(true);
            await importAllConfigs(token, importConfig, overwriteConfig);
            addToast("配置导入成功", "success");
            setImportConfig("");
            loadAIConfig(token);
            loadGlobalSettings(token);
            loadTelegramConfig(token);
        } catch (err: any) {
            addToast(err.message || "导入失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAI = async () => {
        if (!token) return;
        try {
            setLoading(true);
            await saveAIConfig(token, aiForm);
            addToast("AI 配置保存成功", "success");
            loadAIConfig(token);
        } catch (err: any) {
            addToast(err.message || "保存失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleTestAI = async () => {
        if (!token) return;
        try {
            setAITesting(true);
            setAITestResult(null);
            const res = await testAIConnection(token);
            if (res.success) {
                setAITestResult("连接成功: " + res.message);
            } else {
                setAITestResult("连接失败: " + res.message);
            }
        } catch (err: any) {
            setAITestResult("测试出错: " + err.message);
        } finally {
            setAITesting(false);
        }
    };

    const handleDeleteAI = async () => {
        if (!token) return;
        if (!confirm("确定要删除 AI 配置吗？")) return;
        try {
            setLoading(true);
            await deleteAIConfig(token);
            addToast("AI 配置已删除", "success");
            setAIConfigState(null);
            setAIForm({ api_key: "", base_url: "", model: "gpt-4o" });
        } catch (err: any) {
            addToast(err.message || "删除失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGlobal = async () => {
        if (!token) return;
        try {
            setLoading(true);
            await saveGlobalSettings(token, globalSettings);
            addToast("全局设置保存成功", "success");
        } catch (err: any) {
            addToast(err.message || "保存失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTelegram = async () => {
        if (!token) return;
        if (!telegramForm.api_id || !telegramForm.api_hash) {
            addToast("请填写完整信息", "error");
            return;
        }
        try {
            setLoading(true);
            await saveTelegramConfig(token, {
                api_id: telegramForm.api_id,
                api_hash: telegramForm.api_hash,
            });
            addToast("Telegram 配置保存成功", "success");
            loadTelegramConfig(token);
        } catch (err: any) {
            addToast(err.message || "保存失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleResetTelegram = async () => {
        if (!token) return;
        if (!confirm("确定要重置 Telegram 配置为默认值吗？")) return;
        try {
            setLoading(true);
            await resetTelegramConfig(token);
            addToast("配置已重置", "success");
            loadTelegramConfig(token);
        } catch (err: any) {
            addToast(err.message || "操作失败", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!token || checking) {
        return null;
    }

    return (
        <div id="settings-view" className="w-full h-full flex flex-col">
            <nav className="navbar">
                <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/dashboard" className="action-btn" title={t("sidebar_home")}>
                        <CaretLeft weight="bold" />
                    </Link>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-main/40 uppercase tracking-widest text-[10px]">{t("sidebar_home")}</span>
                        <span className="text-main/20">/</span>
                        <span className="text-main uppercase tracking-widest text-[10px]">{t("sidebar_settings")}</span>
                    </div>
                </div>
                <div className="top-right-actions">
                    <ThemeLanguageToggle />
                    <div
                        className="action-btn !text-rose-400 hover:bg-rose-500/10"
                        title={t("logout")}
                        onClick={() => {
                            const { logout } = require("../../../lib/auth");
                            logout();
                            router.push("/");
                        }}
                    >
                        <SignOut weight="bold" />
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{t("settings_title")}</h1>
                    <p className="text-[#9496a1] text-sm">管理您的账户安全、AI 配置及系统偏好设置</p>
                </header>

                <div className="flex flex-col gap-8">
                    {/* 用户名修改 */}
                    <div className="glass-panel p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                                <User weight="bold" size={20} />
                            </div>
                            <h2 className="text-xl font-bold">{t("username")}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label>新用户名</label>
                                <input
                                    type="text"
                                    placeholder="New Username"
                                    value={usernameForm.newUsername}
                                    onChange={(e) => setUsernameForm({ ...usernameForm, newUsername: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>当前密码</label>
                                <input
                                    type="password"
                                    placeholder="Verify Current Password"
                                    value={usernameForm.password}
                                    onChange={(e) => setUsernameForm({ ...usernameForm, password: e.target.value })}
                                />
                            </div>
                        </div>
                        <button className="btn-gradient w-fit px-8" onClick={handleChangeUsername} disabled={loading}>
                            {loading ? <Spinner className="animate-spin" /> : "修改用户名"}
                        </button>
                    </div>

                    {/* 密码修改 */}
                    <div className="glass-panel p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
                                <Lock weight="bold" size={20} />
                            </div>
                            <h2 className="text-xl font-bold">修改密码</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label>旧密码</label>
                                <input
                                    type="password"
                                    value={passwordForm.oldPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>新密码</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label>确认新密码</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>
                        <button className="btn-gradient w-fit px-8" onClick={handleChangePassword} disabled={loading}>
                            {loading ? <Spinner className="animate-spin" /> : "修改密码"}
                        </button>
                    </div>

                    {/* 2FA 设置 */}
                    <div className="glass-panel p-8 overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                                    <ShieldCheck weight="bold" size={20} />
                                </div>
                                <h2 className="text-xl font-bold">两步验证 (2FA)</h2>
                            </div>
                            <div className={`shrink-0 bg-${totpEnabled ? 'emerald' : 'rose'}-500/10 border border-${totpEnabled ? 'emerald' : 'rose'}-500/20 text-${totpEnabled ? 'emerald' : 'rose'}-400 px-4 py-1 rounded-full text-xs font-bold`}>
                                {totpEnabled ? "ENABLED" : "DISABLED"}
                            </div>
                        </div>

                        {!totpEnabled && !showTotpSetup && (
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex gap-6 items-start">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                    <WarningCircle weight="bold" size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-main/70 leading-relaxed max-w-2xl">
                                        启用两步验证将显著提升您的账户安全性。启用后，登录时除了密码外，还需要输入由身份验证器生成的动态代码。
                                    </p>
                                    <button onClick={handleSetupTOTP} className="btn-secondary mt-6 w-fit h-10 px-6 text-sm" disabled={loading}>
                                        开始设置
                                    </button>
                                </div>
                            </div>
                        )}

                        {showTotpSetup && (
                            <div className="animate-float-up space-y-8">
                                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start p-6 bg-white/2 rounded-2xl border border-white/5 shadow-inner">
                                    <div className="bg-white p-4 rounded-xl shrink-0">
                                        <img
                                            src={`/api/user/totp/qrcode?secret=${totpSecret}`}
                                            alt="QR Code"
                                            className="w-40 h-40"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h4 className="font-bold text-main mb-2">1. 扫描二维码</h4>
                                            <p className="text-sm text-[#9496a1]">使用 Google Authenticator 或其他身份验证器扫描左侧二维码</p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-main mb-2">2. 备份密钥</h4>
                                            <div className="p-4 bg-white/2 border border-white/8 rounded-xl text-[13px] break-all font-mono text-[#b57dff]">
                                                {totpSecret}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 max-w-xs">
                                    <label>验证代码</label>
                                    <div className="flex gap-3">
                                        <input
                                            value={totpCode}
                                            onChange={(e) => setTotpCode(e.target.value)}
                                            placeholder="6 位数字代码"
                                            className="text-center text-lg tracking-widest h-12"
                                        />
                                        <button onClick={handleEnableTOTP} className="btn-gradient px-6 shrink-0 h-12" disabled={loading}>
                                            验证
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {totpEnabled && (
                            <button onClick={handleDisableTOTP} className="btn-secondary !text-rose-400 hover:bg-rose-500/10 w-fit px-8" disabled={loading}>
                                停用两步验证
                            </button>
                        )}
                    </div>

                    {/* AI 配置 */}
                    <div className="glass-panel p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                                    <BotIcon weight="bold" size={20} />
                                </div>
                                <h2 className="text-xl font-bold">AI 模型配置</h2>
                            </div>
                            {aiConfig && (
                                <button onClick={handleDeleteAI} className="action-btn !text-rose-400" title="删除 AI 配置">
                                    <Trash weight="bold" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="md:col-span-2">
                                <label>API 密钥</label>
                                <input
                                    type="password"
                                    value={aiForm.api_key}
                                    onChange={(e) => setAIForm({ ...aiForm, api_key: e.target.value })}
                                    placeholder={aiConfig ? "******** (已保存)" : "sk-..."}
                                />
                            </div>
                            <div>
                                <label>基础 URL (Base URL)</label>
                                <input
                                    value={aiForm.base_url}
                                    onChange={(e) => setAIForm({ ...aiForm, base_url: e.target.value })}
                                    placeholder="https://api.openai.com/v1"
                                />
                            </div>
                            <div>
                                <label>预设模型 (Model)</label>
                                <input
                                    value={aiForm.model}
                                    onChange={(e) => setAIForm({ ...aiForm, model: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={handleSaveAI} className="btn-gradient w-fit px-8" disabled={loading}>
                                {loading ? <Spinner className="animate-spin" /> : "保存配置"}
                            </button>
                            <button onClick={handleTestAI} className="btn-secondary w-fit px-8" disabled={aiTesting || !aiConfig}>
                                {aiTesting ? <Spinner className="animate-spin" /> : "连接测试"}
                            </button>
                        </div>

                        {aiTestResult && (
                            <div className={`mt-6 p-5 rounded-2xl text-sm border ${aiTestResult.includes("成功") ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' : 'bg-rose-500/5 text-rose-400 border-rose-500/10'} animate-float-up`}>
                                <div className="flex items-center gap-2 font-bold mb-1 uppercase tracking-wider text-[10px]">
                                    {aiTestResult.includes("成功") ? "Process Successful" : "Process Error"}
                                </div>
                                {aiTestResult}
                            </div>
                        )}
                    </div>

                    {/* 全局设置 */}
                    <div className="glass-panel p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400">
                                <Gear weight="bold" size={20} />
                            </div>
                            <h2 className="text-xl font-bold">全局签到设置</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label>签到间隔 (秒)</label>
                                <input
                                    type="number"
                                    value={globalSettings.sign_interval === null ? "" : globalSettings.sign_interval}
                                    onChange={(e) => setGlobalSettings({ ...globalSettings, sign_interval: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="留空则随机 1-120 秒"
                                />
                                <p className="mt-2 text-[11px] text-[#9496a1]">设置将应用于所有启用全局间隔的任务</p>
                            </div>
                            <div>
                                <label>日志保留天数</label>
                                <input
                                    type="number"
                                    value={globalSettings.log_retention_days}
                                    onChange={(e) => setGlobalSettings({ ...globalSettings, log_retention_days: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <button className="btn-gradient w-fit px-8" onClick={handleSaveGlobal} disabled={loading}>
                            {loading ? <Spinner className="animate-spin" /> : "保存全局参数"}
                        </button>
                    </div>

                    {/* Telegram API 配置 */}
                    <div className="glass-panel p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-400">
                                    <Cpu weight="bold" size={20} />
                                </div>
                                <h2 className="text-xl font-bold">Telegram API 凭据</h2>
                            </div>
                            <button onClick={handleResetTelegram} className="action-btn" title="恢复默认配置">
                                <ArrowUDownLeft weight="bold" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label>API ID</label>
                                <input
                                    value={telegramForm.api_id}
                                    onChange={(e) => setTelegramForm({ ...telegramForm, api_id: e.target.value })}
                                    placeholder="From my.telegram.org"
                                />
                            </div>
                            <div>
                                <label>API Hash</label>
                                <input
                                    value={telegramForm.api_hash}
                                    onChange={(e) => setTelegramForm({ ...telegramForm, api_hash: e.target.value })}
                                    placeholder="From my.telegram.org"
                                />
                            </div>
                        </div>
                        <button className="btn-gradient w-fit px-8" onClick={handleSaveTelegram} disabled={loading}>
                            {loading ? <Spinner className="animate-spin" /> : "应用 API 配置"}
                        </button>
                        <p className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-200/50 leading-relaxed">
                            <span className="font-bold text-amber-400 block mb-1">WARNING</span>
                            修改此配置可能导致现有登录会话失效，建议仅在添加账号出现 API 兼容性问题时才进行自定义。
                        </p>
                    </div>

                    {/* 配置导出导入 */}
                    <div className="glass-panel p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400">
                                <DownloadSimple weight="bold" size={20} />
                            </div>
                            <h2 className="text-xl font-bold">数据备份与迁移</h2>
                        </div>

                        <div className="flex flex-col md:flex-row gap-10">
                            <div className="flex-1">
                                <label className="mb-4">导出全部配置</label>
                                <p className="text-xs text-[#9496a1] mb-6 leading-relaxed">包含所有任务定义与账号基础信息。注意：此文件包含敏感信息，请妥善保管。</p>
                                <button onClick={handleExport} className="btn-secondary w-full flex items-center justify-center gap-2 h-12" disabled={loading}>
                                    <FloppyDisk weight="bold" />
                                    下载配置文件 (.json)
                                </button>
                            </div>

                            <div className="w-px bg-white/5 self-stretch hidden md:block"></div>

                            <div className="flex-1 flex flex-col">
                                <label className="mb-4">导入配置内容</label>
                                <textarea
                                    className="w-full flex-1 min-h-[120px] bg-white/2 rounded-2xl p-4 text-xs font-mono text-main/60 border border-white/5 focus:border-[#8a3ffc]/30 outline-none transition-all placeholder:text-main/20 custom-scrollbar"
                                    placeholder="在此粘贴 JSON 文本内容..."
                                    value={importConfig}
                                    onChange={(e) => setImportConfig(e.target.value)}
                                ></textarea>

                                <div className="flex items-center gap-3 mt-4 mb-6">
                                    <div
                                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-all ${overwriteConfig ? 'bg-[#8a3ffc]' : 'bg-white/10 border border-white/10'}`}
                                        onClick={() => setOverwriteConfig(!overwriteConfig)}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${overwriteConfig ? 'left-5' : 'left-1'}`}></div>
                                    </div>
                                    <span className="text-xs text-main/50 cursor-pointer" onClick={() => setOverwriteConfig(!overwriteConfig)}>
                                        覆盖冲突的任务
                                    </span>
                                </div>

                                <button onClick={handleImport} className="btn-gradient w-full h-12" disabled={loading}>
                                    {loading ? <Spinner className="animate-spin" /> : "执行导入"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
