"use client";

import { useEffect, useState, memo, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getToken } from "../../../lib/auth";
import {
    listSignTasks,
    deleteSignTask,
    runSignTask,
    getAccountChats,
    createSignTask,
    updateSignTask,
    SignTask,
    ChatInfo,
    CreateSignTaskRequest,
} from "../../../lib/api";
import {
    CaretLeft,
    Plus,
    Play,
    PencilSimple,
    Trash,
    Spinner,
    Clock,
    ChatCircleText,
    CheckCircle,
    XCircle,
    Hourglass,
    ArrowClockwise,
    X,
    DotsThreeVertical,
    DiceFive,
    Robot,
    MathOperations,
    Lightning
} from "@phosphor-icons/react";
import { ToastContainer, useToast } from "../../../components/ui/toast";
import { ThemeLanguageToggle } from "../../../components/ThemeLanguageToggle";
import { useLanguage } from "../../../context/LanguageContext";

// Memoized Task Item Component
const TaskItem = memo(({ task, loading, onEdit, onRun, onDelete }: {
    task: SignTask;
    loading: boolean;
    onEdit: (task: SignTask) => void;
    onRun: (name: string) => void;
    onDelete: (name: string) => void;
}) => {
    return (
        <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 group hover:border-[#8a3ffc]/30 transition-all">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#8a3ffc]/10 flex items-center justify-center text-[#b57dff]">
                    <ChatCircleText weight="bold" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate text-sm" title={task.name}>{task.name}</h3>
                        <span className="text-[9px] font-mono text-main/30 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                            {task.chats[0]?.chat_id || "-"}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-main/40">
                            <Clock weight="bold" size={12} />
                            <span className="text-[10px] font-bold font-mono uppercase tracking-wider">{task.sign_at}</span>
                        </div>
                        {task.random_seconds > 0 && (
                            <div className="flex items-center gap-1 text-[#8a3ffc]/60">
                                <Hourglass weight="bold" size={12} />
                                <span className="text-[10px] font-bold">~{Math.round(task.random_seconds / 60)}m</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-8">
                {task.last_run ? (
                    <div className="flex flex-col items-end">
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${task.last_run.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {task.last_run.success ? <CheckCircle weight="bold" /> : <XCircle weight="bold" />}
                            {task.last_run.success ? 'Success' : 'Failed'}
                        </div>
                        <div className="text-[10px] text-main/30 font-mono mt-0.5">
                            {new Date(task.last_run.time).toLocaleString('zh-CN', {
                                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-[10px] text-main/20 font-bold uppercase tracking-widest italic">No Data</div>
                )}

                <div className="flex items-center gap-1 bg-black/10 rounded-xl p-1 border border-white/5">
                    <button
                        onClick={() => onRun(task.name)}
                        disabled={loading}
                        className="action-btn !w-8 !h-8 !text-emerald-400 hover:bg-emerald-500/10"
                        title="立即运行"
                    >
                        <Play weight="fill" size={14} />
                    </button>
                    <button
                        onClick={() => onEdit(task)}
                        disabled={loading}
                        className="action-btn !w-8 !h-8"
                        title="编辑"
                    >
                        <PencilSimple weight="bold" size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(task.name)}
                        disabled={loading}
                        className="action-btn !w-8 !h-8 !text-rose-400 hover:bg-rose-500/10"
                        title="删除"
                    >
                        <Trash weight="bold" size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
});

TaskItem.displayName = "TaskItem";

export default function AccountTasksContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const accountName = searchParams.get("name") || "";
    const { toasts, addToast, removeToast } = useToast();

    const [token, setLocalToken] = useState<string | null>(null);
    const [tasks, setTasks] = useState<SignTask[]>([]);
    const [chats, setChats] = useState<ChatInfo[]>([]);
    const [loading, setLoading] = useState(false);

    // 创建任务对话框
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newTask, setNewTask] = useState({
        name: "",
        sign_at: "0 6 * * *",
        random_minutes: 0,  // 改为分钟
        chat_id: 0,
        chat_id_manual: "",
        chat_name: "",
        actions: [{ action: 1, text: "" }],
        delete_after: undefined as number | undefined,
        action_interval: 1,
    });

    // 编辑任务对话框
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingTaskName, setEditingTaskName] = useState("");
    const [editTask, setEditTask] = useState({
        sign_at: "0 6 * * *",
        random_minutes: 0,
        chat_id: 0,
        chat_id_manual: "",
        chat_name: "",
        actions: [{ action: 1, text: "" }] as any[],
        delete_after: undefined as number | undefined,
        action_interval: 1,
    });

    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const tokenStr = getToken();
        if (!tokenStr) {
            window.location.replace("/");
            return;
        }
        if (!accountName) {
            window.location.replace("/dashboard");
            return;
        }
        setLocalToken(tokenStr);
        setChecking(false);
        loadData(tokenStr);
    }, [accountName]);

    const loadData = async (tokenStr: string) => {
        try {
            setLoading(true);
            const [tasksData, chatsData] = await Promise.all([
                listSignTasks(tokenStr, accountName),  // 按账号名筛选任务
                getAccountChats(tokenStr, accountName),
            ]);

            setTasks(tasksData);
            setChats(chatsData);
        } catch (err: any) {
            addToast(err.message || t("login_failed"), "error");
        } finally {
            setLoading(false);
        }
    };

    const refreshChats = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const chatsData = await getAccountChats(token, accountName);
            setChats(chatsData);
            addToast("Chat 列表已刷新", "success");
        } catch (err: any) {
            addToast(err.message || "刷新失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskName: string) => {
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

    const handleRunTask = async (taskName: string) => {
        if (!token) return;

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

    const handleCreateTask = async () => {
        if (!token) return;

        if (!newTask.name) {
            addToast("请输入任务名称", "error");
            return;
        }

        if (!newTask.sign_at) {
            addToast("请输入签到时间", "error");
            return;
        }

        // 确定使用哪个 Chat ID
        let chatId = newTask.chat_id;
        if (newTask.chat_id_manual) {
            chatId = parseInt(newTask.chat_id_manual);
            if (isNaN(chatId)) {
                addToast("手动输入的 Chat ID 必须是数字", "error");
                return;
            }
        }

        if (chatId === 0) {
            addToast("请选择或输入 Chat ID", "error");
            return;
        }

        if (newTask.actions.length === 0 || !newTask.actions[0].text) {
            addToast("请至少添加一个动作", "error");
            return;
        }

        try {
            setLoading(true);

            const request: CreateSignTaskRequest = {
                name: newTask.name,
                account_name: accountName,  // 关联当前账号
                sign_at: newTask.sign_at,
                chats: [{
                    chat_id: chatId,
                    name: newTask.chat_name || `Chat ${chatId}`,
                    actions: newTask.actions,
                    delete_after: newTask.delete_after,
                    action_interval: newTask.action_interval,
                }],
                random_seconds: newTask.random_minutes * 60,  // 分钟转换为秒
            };

            await createSignTask(token, request);
            addToast("任务创建成功！", "success");
            setShowCreateDialog(false);
            setNewTask({
                name: "",
                sign_at: "0 6 * * *",
                random_minutes: 0,
                chat_id: 0,
                chat_id_manual: "",
                chat_name: "",
                actions: [{ action: 1, text: "" }],
                delete_after: undefined,
                action_interval: 1,
            });
            await loadData(token);
        } catch (err: any) {
            addToast(err.message || "创建任务失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAction = () => {
        setNewTask({
            ...newTask,
            actions: [...newTask.actions, { action: 1, text: "" }],
        });
    };

    const handleUpdateAction = (index: number, field: string, value: any) => {
        const newActions = [...newTask.actions];
        newActions[index] = { ...newActions[index], [field]: value };
        setNewTask({ ...newTask, actions: newActions });
    };

    const handleRemoveAction = (index: number) => {
        setNewTask({
            ...newTask,
            actions: newTask.actions.filter((_, i) => i !== index),
        });
    };

    const handleEditTask = (task: SignTask) => {
        setEditingTaskName(task.name);
        const chat = task.chats[0];
        setEditTask({
            sign_at: task.sign_at,
            random_minutes: Math.round(task.random_seconds / 60),
            chat_id: chat?.chat_id || 0,
            chat_id_manual: chat?.chat_id?.toString() || "",
            chat_name: chat?.name || "",
            actions: chat?.actions || [{ action: 1, text: "" }],
            delete_after: chat?.delete_after,
            action_interval: chat?.action_interval || 1,
        });
        setShowEditDialog(true);
    };

    const handleSaveEdit = async () => {
        if (!token) return;

        // 验证 Chat ID
        const chatId = editTask.chat_id || parseInt(editTask.chat_id_manual) || 0;
        if (!chatId) {
            addToast("请选择或输入 Chat ID", "error");
            return;
        }

        if (editTask.actions.length === 0 || !editTask.actions[0].text) {
            addToast("请至少添加一个动作", "error");
            return;
        }

        try {
            setLoading(true);

            await updateSignTask(token, editingTaskName, {
                sign_at: editTask.sign_at,
                random_seconds: editTask.random_minutes * 60,
                chats: [{
                    chat_id: chatId,
                    name: editTask.chat_name || `Chat ${chatId}`,
                    actions: editTask.actions,
                    delete_after: editTask.delete_after,
                    action_interval: editTask.action_interval,
                }],
            });

            addToast("任务更新成功！", "success");
            setShowEditDialog(false);
            await loadData(token);
        } catch (err: any) {
            addToast(err.message || "更新任务失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditAddAction = () => {
        setEditTask({
            ...editTask,
            actions: [...editTask.actions, { action: 1, text: "" }],
        });
    };

    const handleEditRemoveAction = (index: number) => {
        if (editTask.actions.length <= 1) return;
        setEditTask({
            ...editTask,
            actions: editTask.actions.filter((_, i) => i !== index),
        });
    };

    const { t } = useLanguage();

    if (!token || checking) {
        return null;
    }

    return (
        <div id="account-tasks-view" className="w-full h-full flex flex-col">
            <nav className="navbar">
                <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href="/dashboard" className="action-btn" title={t("sidebar_home")}>
                        <CaretLeft weight="bold" />
                    </Link>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-main/40 uppercase tracking-widest text-[10px]">{t("sidebar_home")}</span>
                        <span className="text-main/20">/</span>
                        <span className="text-main uppercase tracking-widest text-[10px]">{accountName}</span>
                    </div>
                </div>
                <div className="top-right-actions">
                    <button onClick={() => setShowCreateDialog(true)} className="btn-gradient !h-9 !px-4 !text-xs !rounded-lg flex items-center gap-2">
                        <Plus weight="bold" />
                        {t("add_task")}
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>
                    <ThemeLanguageToggle />
                </div>
            </nav>

            <main className="main-content">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">任务详情</h1>
                        <p className="text-[#9496a1] text-sm">管理账号 <span className="text-main font-bold">{accountName}</span> 的所有自动签到任务</p>
                    </div>
                    <button
                        onClick={refreshChats}
                        disabled={loading}
                        className="action-btn"
                        title="刷新 Chat 列表"
                    >
                        <ArrowClockwise weight="bold" className={loading ? 'animate-spin' : ''} />
                    </button>
                </header>

                {loading && tasks.length === 0 ? (
                    <div className="w-full py-20 flex flex-col items-center justify-center text-main/20">
                        <Spinner size={40} weight="bold" className="animate-spin mb-4" />
                        <p className="text-xs uppercase tracking-widest font-bold font-mono">{t("login_loading")}</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="glass-panel p-20 flex flex-col items-center text-center justify-center border-dashed border-2 group hover:border-[#8a3ffc]/30 transition-all cursor-pointer" onClick={() => setShowCreateDialog(true)}>
                        <div className="w-20 h-20 rounded-3xl bg-main/5 flex items-center justify-center text-main/20 mb-6 group-hover:scale-110 transition-transform group-hover:bg-[#8a3ffc]/10 group-hover:text-[#8a3ffc]">
                            <Plus size={40} weight="bold" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">配置第一个签到目的地</h3>
                        <p className="text-sm text-[#9496a1]">选择一个频道或群组，设定动作与时间点</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {tasks.map((task) => (
                            <TaskItem
                                key={task.name}
                                task={task}
                                loading={loading}
                                onEdit={handleEditTask}
                                onRun={handleRunTask}
                                onDelete={handleDeleteTask}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* 创建/编辑对话框通用的渲染逻辑 */}
            {(showCreateDialog || showEditDialog) && (
                <div className="modal-overlay active" onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); }}>
                    <div className="glass-panel modal-content !max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <header className="modal-header border-b border-white/5 pb-4 mb-6">
                            <div className="modal-title flex items-center gap-3">
                                <div className="p-2 bg-[#8a3ffc]/10 rounded-lg text-[#b57dff]">
                                    <Lightning weight="fill" size={20} />
                                </div>
                                {showCreateDialog ? "创建签到任务" : `编辑任务: ${editingTaskName}`}
                            </div>
                            <div
                                onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); }}
                                className="modal-close"
                            >
                                <X weight="bold" />
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {showCreateDialog && (
                                    <div>
                                        <label>任务名称</label>
                                        <input
                                            placeholder="linuxdo_sign"
                                            value={newTask.name}
                                            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div className={showEditDialog ? "md:col-span-2" : ""}>
                                    <label>签到时间 (CRON)</label>
                                    <input
                                        placeholder="0 6 * * *"
                                        value={showCreateDialog ? newTask.sign_at : editTask.sign_at}
                                        onChange={(e) => showCreateDialog
                                            ? setNewTask({ ...newTask, sign_at: e.target.value })
                                            : setEditTask({ ...editTask, sign_at: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label>随机延迟 (分钟)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={showCreateDialog ? newTask.random_minutes : editTask.random_minutes}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            showCreateDialog
                                                ? setNewTask({ ...newTask, random_minutes: val })
                                                : setEditTask({ ...editTask, random_minutes: val });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label>动作间隔 (秒)</label>
                                    <input
                                        type="number"
                                        value={showCreateDialog ? newTask.action_interval : editTask.action_interval}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            showCreateDialog
                                                ? setNewTask({ ...newTask, action_interval: val })
                                                : setEditTask({ ...editTask, action_interval: val });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="glass-panel !bg-black/5 p-5 space-y-6 border-white/5">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1">
                                        <label className="mb-2 block">选择频道/群组 (Chat)</label>
                                        <select
                                            value={showCreateDialog ? newTask.chat_id : editTask.chat_id}
                                            onChange={(e) => {
                                                const id = parseInt(e.target.value);
                                                const chat = chats.find(c => c.id === id);
                                                if (showCreateDialog) {
                                                    setNewTask({
                                                        ...newTask,
                                                        chat_id: id,
                                                        chat_id_manual: "",
                                                        chat_name: chat?.title || chat?.username || "",
                                                    });
                                                } else {
                                                    setEditTask({
                                                        ...editTask,
                                                        chat_id: id,
                                                        chat_id_manual: "",
                                                        chat_name: chat?.title || "",
                                                    });
                                                }
                                            }}
                                        >
                                            <option value={0}>从列表选择...</option>
                                            {chats.map(chat => (
                                                <option key={chat.id} value={chat.id}>
                                                    {chat.title || chat.username || chat.id}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="mb-2 block">或手动输入 Chat ID</label>
                                        <input
                                            placeholder="Manual Chat ID..."
                                            value={showCreateDialog ? newTask.chat_id_manual : editTask.chat_id_manual}
                                            onChange={(e) => {
                                                if (showCreateDialog) {
                                                    setNewTask({ ...newTask, chat_id_manual: e.target.value, chat_id: 0 });
                                                } else {
                                                    setEditTask({ ...editTask, chat_id_manual: e.target.value, chat_id: 0 });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label>消息删除延迟 (秒, 可选)</label>
                                    <input
                                        type="number"
                                        placeholder="发送后多久自动删除指令..."
                                        value={(showCreateDialog ? newTask.delete_after : editTask.delete_after) || ""}
                                        onChange={(e) => {
                                            const val = e.target.value ? parseInt(e.target.value) : undefined;
                                            showCreateDialog
                                                ? setNewTask({ ...newTask, delete_after: val })
                                                : setEditTask({ ...editTask, delete_after: val });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-main/40 flex items-center gap-2">
                                        <DotsThreeVertical weight="bold" />
                                        有序动作序列
                                    </h3>
                                    <button
                                        onClick={showCreateDialog ? handleAddAction : handleEditAddAction}
                                        className="btn-secondary !h-8 !px-3 !text-[10px]"
                                    >
                                        + 添加动作
                                    </button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {(showCreateDialog ? newTask.actions : editTask.actions).map((action, index) => (
                                        <div key={index} className="flex gap-3 items-start animate-scale-in">
                                            <div className="shrink-0 w-6 h-10 flex items-center justify-center font-mono text-[10px] text-main/20 font-bold border-r border-white/5">
                                                {index + 1}
                                            </div>
                                            <select
                                                className="!w-[140px]"
                                                value={action.action}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (showCreateDialog) handleUpdateAction(index, "action", val);
                                                    else {
                                                        const newActions = [...editTask.actions];
                                                        newActions[index] = { ...newActions[index], action: val };
                                                        setEditTask({ ...editTask, actions: newActions });
                                                    }
                                                }}
                                            >
                                                <option value={1}>发送文本</option>
                                                <option value={2}>发送骰子</option>
                                                <option value={3}>点击按钮</option>
                                                <option value={4}>AI 图片识别</option>
                                                <option value={5}>AI 计算题</option>
                                            </select>

                                            <div className="flex-1">
                                                {(action.action === 1 || action.action === 3) && (
                                                    <input
                                                        placeholder={action.action === 1 ? "发送的消息内容..." : "要点击的按钮上的文字..."}
                                                        value={action.text || ""}
                                                        onChange={(e) => {
                                                            if (showCreateDialog) handleUpdateAction(index, "text", e.target.value);
                                                            else {
                                                                const newActions = [...editTask.actions];
                                                                newActions[index] = { ...newActions[index], text: e.target.value };
                                                                setEditTask({ ...editTask, actions: newActions });
                                                            }
                                                        }}
                                                    />
                                                )}
                                                {action.action === 2 && (
                                                    <div className="flex gap-2">
                                                        {['🎲', '🎯', '🏀', '⚽', '🎰', '🎳'].map(d => (
                                                            <button
                                                                key={d}
                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${((action as any).dice === d) ? 'bg-[#8a3ffc]/20 border border-[#8a3ffc]/40' : 'bg-white/5 border border-white/5 hover:bg-white/10'}`}
                                                                onClick={() => {
                                                                    if (showCreateDialog) handleUpdateAction(index, "dice", d);
                                                                    else {
                                                                        const newActions = [...editTask.actions];
                                                                        newActions[index] = { ...newActions[index], dice: d };
                                                                        setEditTask({ ...editTask, actions: newActions });
                                                                    }
                                                                }}
                                                            >
                                                                {d}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {action.action === 4 && (
                                                    <div className="h-10 px-4 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[#8183ff] text-xs font-bold uppercase tracking-wider">
                                                        <Robot weight="fill" size={16} />
                                                        AI Vision Mode
                                                    </div>
                                                )}
                                                {action.action === 5 && (
                                                    <div className="h-10 px-4 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-bold uppercase tracking-wider">
                                                        <MathOperations weight="fill" size={16} />
                                                        AI Logic Solver
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => showCreateDialog ? handleRemoveAction(index) : handleEditRemoveAction(index)}
                                                className="action-btn !w-10 !h-10 !text-rose-400 !bg-rose-500/5 hover:!bg-rose-500/10"
                                            >
                                                <Trash weight="bold" size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <footer className="mt-8 flex gap-3">
                            <button
                                className="btn-secondary flex-1"
                                onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); }}
                            >
                                取消
                            </button>
                            <button
                                className="btn-gradient flex-1"
                                onClick={showCreateDialog ? handleCreateTask : handleSaveEdit}
                                disabled={loading}
                            >
                                {loading ? <Spinner className="animate-spin" /> : (showCreateDialog ? "立即部署" : "保存修改")}
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
