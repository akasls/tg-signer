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
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
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
        <div className="min-h-screen bg-transparent text-white p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                                {t("sidebar_tasks")}
                            </h1>
                            <p className="text-white/40 text-sm mt-1">
                                {t("sidebar_tasks")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <ThemeLanguageToggle />
                        <Link href="/dashboard/sign-tasks/create">
                            <Button className="glass-button bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/30">
                                <span className="mr-2">+</span>
                                {t("add_task")}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Task List Container */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {loading && tasks.length === 0 ? (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/20">
                            <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                            <p>{t("login_loading")}</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="col-span-full">
                            <div className="glass p-12 text-center rounded-3xl border border-white/10">
                                <div className="text-6xl mb-6 grayscale opacity-20">📋</div>
                                <h3 className="text-xl font-medium text-white/60 mb-2">{t("sidebar_tasks")}</h3>
                                <p className="text-white/30 mb-8 max-w-md mx-auto">暂无签到任务，点击上方按钮创建第一个任务</p>
                                <Link href="/dashboard/sign-tasks/create">
                                    <Button className="glass-button">{t("add_task")}</Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <Card key={task.name} className="glass border-white/10 overflow-hidden hover:border-indigo-500/30 transition-all duration-500 group">
                                <CardHeader className="p-6 pb-4 border-b border-white/5 bg-white/5">
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                ⚡
                                            </div>
                                            <span className="font-bold truncate max-w-[160px]">{task.name}</span>
                                        </div>
                                        <div className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${task.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/10 text-white/40 border border-white/10'}`}>
                                            {task.enabled ? 'Active' : 'Disabled'}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Time</div>
                                                <div className="font-mono text-sm text-indigo-300">{task.sign_at}</div>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Chats</div>
                                                <div className="font-mono text-sm text-purple-300">{task.chats.length}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link href={`/dashboard/account-tasks/AccountTasksContent?name=${task.name}`} className="flex-1">
                                                <Button className="w-full glass-button text-xs py-2 bg-white/5 hover:bg-white/10">
                                                    {t("edit")}
                                                </Button>
                                            </Link>
                                            <Button
                                                onClick={() => handleRun(task.name)}
                                                disabled={loading}
                                                className="glass-button bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-xs py-2"
                                            >
                                                {t("run")}
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(task.name)}
                                                disabled={loading}
                                                className="glass-button bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20 text-xs py-2"
                                            >
                                                {t("delete")}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
