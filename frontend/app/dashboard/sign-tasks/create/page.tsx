"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken } from "../../../../lib/auth";
import {
    createSignTask,
    listAccounts,
    getAccountChats,
    AccountInfo,
    ChatInfo,
    SignTaskChat,
} from "../../../../lib/api";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { ThemeLanguageToggle } from "../../../../components/ThemeLanguageToggle";
import { useLanguage } from "../../../../context/LanguageContext";
import { ToastContainer, useToast } from "../../../../components/ui/toast";

export default function CreateSignTaskPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const { toasts, addToast, removeToast } = useToast();
    const [token, setLocalToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // 表单数据
    const [taskName, setTaskName] = useState("");
    const [signAt, setSignAt] = useState("0 6 * * *");
    const [randomSeconds, setRandomSeconds] = useState(0);
    const [signInterval, setSignInterval] = useState(1);
    const [chats, setChats] = useState<SignTaskChat[]>([]);

    // 账号和 Chat 数据
    const [accounts, setAccounts] = useState<AccountInfo[]>([]);
    const [selectedAccount, setSelectedAccount] = useState("");
    const [availableChats, setAvailableChats] = useState<ChatInfo[]>([]);

    // 当前编辑的 Chat
    const [editingChat, setEditingChat] = useState<{
        chat_id: number;
        name: string;
        actions: any[];
        delete_after?: number;
        action_interval: number;
    } | null>(null);

    useEffect(() => {
        const tokenStr = getToken();
        if (!tokenStr) {
            router.replace("/");
            return;
        }
        setLocalToken(tokenStr);
        loadAccounts(tokenStr);
    }, [router]);

    const loadAccounts = async (tokenStr: string) => {
        try {
            const data = await listAccounts(tokenStr);
            setAccounts(data.accounts);
            if (data.accounts.length > 0) {
                setSelectedAccount(data.accounts[0].name);
                loadChats(tokenStr, data.accounts[0].name);
            }
        } catch (err: any) {
            addToast(err.message || "加载失败", "error");
        }
    };

    const loadChats = async (tokenStr: string, accountName: string) => {
        try {
            const chatsData = await getAccountChats(tokenStr, accountName);
            setAvailableChats(chatsData);
        } catch (err: any) {
            console.error("加载 Chat 失败:", err);
        }
    };

    const handleAccountChange = (accountName: string) => {
        setSelectedAccount(accountName);
        if (token) {
            loadChats(token, accountName);
        }
    };

    const handleAddChat = () => {
        setEditingChat({
            chat_id: 0,
            name: "",
            actions: [],
            action_interval: 1,
        });
    };

    const handleSaveChat = () => {
        if (!editingChat) return;
        if (editingChat.chat_id === 0) {
            addToast("请选择一个 Chat", "error");
            return;
        }
        if (editingChat.actions.length === 0) {
            addToast("请至少添加一个动作", "error");
            return;
        }
        setChats([...chats, editingChat]);
        setEditingChat(null);
    };

    const handleSubmit = async () => {
        if (!token) return;
        if (!taskName || !signAt) {
            addToast("请填写任务名称和时间", "error");
            return;
        }
        if (chats.length === 0) {
            addToast("请至少添加一个 Chat", "error");
            return;
        }

        try {
            setLoading(true);
            await createSignTask(token, {
                name: taskName,
                account_name: selectedAccount,
                sign_at: signAt,
                chats: chats,
                random_seconds: randomSeconds,
                sign_interval: signInterval,
            });
            addToast("任务创建成功", "success");
            setTimeout(() => router.push("/dashboard/sign-tasks"), 1500);
        } catch (err: any) {
            addToast(err.message || "创建失败", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen bg-transparent text-white p-4 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/sign-tasks" className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            {t("add_task")}
                        </h1>
                    </div>
                    <ThemeLanguageToggle />
                </div>

                <div className="grid gap-6">
                    <Card className="glass border-white/10">
                        <CardHeader><CardTitle className="text-lg">基本配置</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>任务名称</Label>
                                <Input className="glass-input" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="linuxdo_sign" />
                            </div>
                            <div className="space-y-2">
                                <Label>签到时间 (CRON)</Label>
                                <Input className="glass-input font-mono" value={signAt} onChange={(e) => setSignAt(e.target.value)} placeholder="0 6 * * *" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>关联账号</Label>
                                    <select
                                        className="w-full glass-input bg-zinc-900 border-white/10 rounded-xl p-2.5 outline-none focus:border-indigo-500/50 transition-all"
                                        value={selectedAccount}
                                        onChange={(e) => handleAccountChange(e.target.value)}
                                    >
                                        {accounts.map(acc => <option key={acc.name} value={acc.name}>{acc.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>随机延迟 (秒)</Label>
                                    <Input type="number" className="glass-input" value={randomSeconds} onChange={(e) => setRandomSeconds(parseInt(e.target.value) || 0)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-white/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Chat 配置 ({chats.length})</CardTitle>
                            <Button onClick={handleAddChat} className="glass-button text-xs py-1.5">+ 添加 Chat</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {chats.map((chat, idx) => (
                                    <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                                        <div>
                                            <div className="font-bold">{chat.name}</div>
                                            <div className="text-xs text-white/40">ID: {chat.chat_id} | Actions: {chat.actions.length}</div>
                                        </div>
                                        <Button variant="ghost" onClick={() => setChats(chats.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                                            {t("delete")}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-4">
                        <Button onClick={() => router.back()} variant="ghost" className="flex-1 glass-button">{t("cancel")}</Button>
                        <Button onClick={handleSubmit} disabled={loading} className="flex-1 glass-button bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                            {loading ? t("login_loading") : t("save")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Editing Dialog - Simplified for brevity in implementation */}
            {editingChat && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="glass border-white/10 w-full max-w-lg p-6 space-y-4">
                        <h2 className="text-xl font-bold">配置 Chat</h2>
                        <div className="space-y-4">
                            <Label>选择目标 Chat</Label>
                            <select
                                className="w-full glass-input bg-zinc-900 border-white/10 rounded-xl p-2.5"
                                value={editingChat.chat_id}
                                onChange={(e) => {
                                    const cid = parseInt(e.target.value);
                                    const chat = availableChats.find(c => c.id === cid);
                                    setEditingChat({ ...editingChat, chat_id: cid, name: chat?.title || chat?.username || "" });
                                }}
                            >
                                <option value={0}>请选择...</option>
                                {availableChats.map(c => <option key={c.id} value={c.id}>{c.title || c.username}</option>)}
                            </select>

                            <Button onClick={() => setEditingChat({ ...editingChat, actions: [...editingChat.actions, { action: 1, text: "Check in" }] })} variant="ghost" className="text-xs text-indigo-400">+ 添加签到动作</Button>

                            <div className="flex gap-2">
                                <Button onClick={() => setEditingChat(null)} variant="ghost" className="flex-1 glass-button">{t("cancel")}</Button>
                                <Button onClick={handleSaveChat} className="flex-1 glass-button bg-emerald-500/20 text-emerald-400 border-emerald-500/20">确定</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
