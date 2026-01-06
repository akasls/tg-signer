"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "../../../lib/auth";
import {
    listSignTasks,
    deleteSignTask,
    runSignTask,
    listAccounts,
    SignTask,
    AccountInfo,
} from "../../../lib/api";
import {
    Plus,
    CaretLeft,
    Play,
    PencilSimple,
    Trash,
    Spinner,
    Lightning,
    Clock,
    ChatCircleText,
    ArrowClockwise,
} from "@phosphor-icons/react";
import { ToastContainer, useToast } from "../../../components/ui/toast";
import { ThemeLanguageToggle } from "../../../components/ThemeLanguageToggle";
import { useLanguage } from "../../../context/LanguageContext";

export default function SignTasksPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { toasts, addToast, removeToast } = useToast();
    const [token, setLocalToken] = useState<string | null>(null);
    const [tasks, setTasks] = useState<SignTask[]>([]);
    const [accounts, setAccounts] = useState<AccountInfo[]>([]);
    const [loading, setLoading] = useState(false);
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
            const [tasksData, accountsData] = await Promise.all([
                listSignTasks(tokenStr),
                listAccounts(tokenStr),
            ]);
            setTasks(tasksData);
            setAccounts(accountsData.accounts);
        } catch (err: any) {
            addToast(err.message || t("login_failed"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (taskName: string) => {
        if (!token) return;

        if (!confirm(t("confirm_delete"))) {
            return;
        }

        try {
            setLoading(true);
            await deleteSignTask(token, taskName);
            addToast(t("delete") + " " + taskName + " " + t("login_success"), "success");
            await loadData(token);
        } catch (err: any) {
            addToast(err.message || t("login_failed"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRun = async (taskName: string) => {
        if (!token) return;

        // 选择账号 (Simplified for multi-language, usually this would be a select dialog)
        const accountName = prompt(t("username"));
        if (!accountName) return;

        try {
            setLoading(true);
            const result = await runSignTask(token, taskName, accountName);

            if (result.success) {
                addToast(taskName + " " + t("run") + " " + t("login_success"), "success");
            } else {
                addToast(t("login_failed") + ": " + result.error, "error");
            }
        } catch (err: any) {
            addToast(err.message || t("login_failed"), "error");
        } finally {
            setLoading(false);
        }
    };

    if (!token || checking) {
        return null;
    }

    return (
        <div id="tasks-view" className="w-full h-full flex flex-col">
            <nav className="navbar">
                <div className="nav-brand">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="action-btn !w-8 !h-8" title={t("sidebar_home")}>
                            <CaretLeft weight="bold" size={18} />
                        </Link>
                        <h1 className="text-lg font-bold tracking-tight">{t("sidebar_tasks")}</h1>
                    </div>
                </div>
                <div className="top-right-actions">
                    <button
                        onClick={() => loadData(token)}
                        disabled={loading}
                        className="action-btn !w-8 !h-8"
                        title={t("refresh")}
                    >
                        <ArrowClockwise weight="bold" size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <Link href="/dashboard/sign-tasks/create" className="action-btn !w-8 !h-8 !text-[#8a3ffc] hover:bg-[#8a3ffc]/10" title={t("add_task")}>
                        <Plus weight="bold" size={18} />
                    </Link>
                </div>
            </nav>

            <main className="main-content !pt-6">

                {loading && tasks.length === 0 ? (
                    <div className="w-full py-20 flex flex-col items-center justify-center text-main/20">
                        <Spinner size={40} weight="bold" className="animate-spin mb-4" />
                        <p className="text-xs uppercase tracking-widest font-bold font-mono">{t("login_loading")}</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="glass-panel p-20 flex flex-col items-center text-center justify-center border-dashed border-2 group hover:border-[#8a3ffc]/30 transition-all cursor-pointer" onClick={() => router.push("/dashboard/sign-tasks/create")}>
                        <div className="w-20 h-20 rounded-3xl bg-main/5 flex items-center justify-center text-main/20 mb-6 group-hover:scale-110 transition-transform group-hover:bg-[#8a3ffc]/10 group-hover:text-[#8a3ffc]">
                            <Plus size={40} weight="bold" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">部署第一个任务</h3>
                        <p className="text-sm text-[#9496a1] mb-8">点击此处或右上角按钮开始创建您的首个自动签到任务</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {tasks.map((task) => (
                            <div key={task.name} className="glass-panel p-6 flex flex-col group hover:border-[#8a3ffc]/40 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8a3ffc]/20 to-[#e83ffc]/20 flex items-center justify-center text-[#b57dff] group-hover:scale-110 transition-transform">
                                            <Lightning weight="fill" size={24} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-lg truncate pr-2" title={task.name}>{task.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border ${task.enabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-main/30 border-white/10'}`}>
                                                    {task.enabled ? 'Active' : 'Paused'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 text-main/40">
                                            <Clock weight="bold" size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Schedule</span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-[#b57dff]">{task.sign_at}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 text-main/40">
                                            <ChatCircleText weight="bold" size={14} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Channels</span>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-[#e83ffc]">{task.chats.length} Hits</span>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between bg-black/10 -mx-6 -mb-6 p-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleRun(task.name)}
                                            className="action-btn !text-emerald-400 hover:bg-emerald-500/10"
                                            title={t("run")}
                                        >
                                            <Play weight="fill" />
                                        </button>
                                        <Link href={`/dashboard/account-tasks/AccountTasksContent?name=${task.name}`} className="action-btn" title={t("edit")}>
                                            <PencilSimple weight="bold" />
                                        </Link>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(task.name)}
                                        className="action-btn !text-rose-400 hover:bg-rose-500/10"
                                        title={t("delete")}
                                    >
                                        <Trash weight="bold" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
