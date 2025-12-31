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

export default function SignTasksPage() {
    const router = useRouter();
    const { toasts, addToast, removeToast } = useToast();
    const [token, setLocalToken] = useState<string | null>(null);
    const [tasks, setTasks] = useState<SignTask[]>([]);
    const [accounts, setAccounts] = useState<AccountInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const t = getToken();
        if (!t) {
            // 使用硬跳转确保在静态导出模式下正常工作
            window.location.href = "/";
            return;
        }
        setLocalToken(t);
        loadData(t);
    }, [mounted]);

    const loadData = async (t: string) => {
        try {
            setLoading(true);
            const [tasksData, accountsData] = await Promise.all([
                listSignTasks(t),
                listAccounts(t),
            ]);
            setTasks(tasksData);
            console.log("Sign Tasks Data:", tasksData);
            setAccounts(accountsData.accounts);
        } catch (err: any) {
            addToast(err.message || "加载数据失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (taskName: string) => {
        if (!token) return;

        if (!confirm(`确定要删除任务 ${taskName} 吗？`)) {
            return;
        }

        try {
            setLoading(true);
            await deleteSignTask(token, taskName);
            addToast(`任务 ${taskName} 已删除`, "success");
            await loadData(token);
        } catch (err: any) {
            addToast(err.message || "删除任务失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleRun = async (taskName: string) => {
        if (!token) return;

        // 选择账号
        const accountName = prompt("请输入要使用的账号名称：");
        if (!accountName) return;

        try {
            setLoading(true);
            const result = await runSignTask(token, taskName, accountName);

            if (result.success) {
                addToast(`任务 ${taskName} 运行成功`, "success");
            } else {
                addToast(`任务运行失败: ${result.error}`, "error");
            }
        } catch (err: any) {
            addToast(err.message || "运行任务失败", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return null;
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* 标题和创建按钮 */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">签到任务管理</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            管理您的 Telegram 自动签到任务
                        </p>
                    </div>
                    <Link href="/dashboard/sign-tasks/create">
                        <Button>+ 创建任务</Button>
                    </Link>
                </div>

                {/* 任务列表 */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loading && tasks.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            加载中...
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="col-span-full">
                            <Card>
                                <CardContent className="py-12 text-center text-gray-500">
                                    <div className="text-4xl mb-4">📋</div>
                                    <p className="mb-4">暂无签到任务</p>
                                    <Link href="/dashboard/sign-tasks/create">
                                        <Button>创建第一个任务</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <Card key={task.name} className="card-hover">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">⚡</span>
                                            <span className="truncate">{task.name}</span>
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded ${task.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                            {task.enabled ? '已启用' : '已禁用'}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {/* 基本信息 */}
                                        <div className="text-sm">
                                            <div className="text-gray-500">签到时间</div>
                                            <div className="font-mono text-xs mt-1">{task.sign_at}</div>
                                        </div>

                                        <div className="text-sm">
                                            <div className="text-gray-500">Chat 数量</div>
                                            <div className="mt-1">{task.chats.length} 个</div>
                                        </div>

                                        {task.random_seconds > 0 && (
                                            <div className="text-sm">
                                                <div className="text-gray-500">随机延迟</div>
                                                <div className="mt-1">{task.random_seconds} 秒</div>
                                            </div>
                                        )}

                                        {/* 操作按钮 */}
                                        <div className="flex gap-2 pt-2">
                                            <Link href={`/dashboard/sign-tasks/${task.name}`} className="flex-1">
                                                <Button variant="secondary" size="sm" className="w-full">
                                                    编辑
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleRun(task.name)}
                                                disabled={loading}
                                            >
                                                运行
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(task.name)}
                                                disabled={loading}
                                            >
                                                删除
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* 返回按钮 */}
                <div className="mt-6">
                    <Link href="/dashboard">
                        <Button variant="secondary">← 返回主页</Button>
                    </Link>
                </div>
            </div>

            {/* Toast 通知容器 */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
