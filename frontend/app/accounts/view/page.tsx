"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Settings2, Trash2, KeyRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskList } from "@/components/tasks/task-list";
import { AddTaskDialog } from "@/components/tasks/add-task-dialog";

interface Account {
    id: number;
    account_name: string;
    api_id: string;
    created_at: string;
    status: string;
}

export default function AccountDetailPage() {
    return (
        <React.Suspense fallback={<div className="p-8">Loading...</div>}>
            <AccountDetailContent />
        </React.Suspense>
    );
}

function AccountDetailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const accountName = searchParams.get("name") as string;

    const [account, setAccount] = useState<Account | null>(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!accountName) return;
        try {
            // 1. Get Account Details (for ID)
            const accRes = await fetch(`/api/accounts/${accountName}`);
            if (!accRes.ok) throw new Error("Account not found");
            const accData = await accRes.json();
            setAccount(accData);

            // 2. Get Tasks
            const tasksRes = await fetch(`/api/tasks?account_id=${accData.id}`);
            if (tasksRes.ok) {
                const tasksData = await tasksRes.json();
                setTasks(tasksData);
            }
        } catch (err) {
            console.error(err);
            // router.push("/accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accountName) {
            fetchData();
        }
    }, [accountName]);

    if (!accountName) return <div className="p-8">Invalid account</div>;
    if (loading) return <div className="p-8">Loading...</div>;
    if (!account) return <div className="p-8">Account not found</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/accounts">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{account.account_name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="font-mono text-muted-foreground">ID: {account.id}</Badge>
                            <Badge className="bg-green-500/15 text-green-600 border-0">Connected</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={async () => {
                        if (confirm("Delete account?")) {
                            await fetch(`/api/accounts/${account.account_name}`, { method: 'DELETE' });
                            router.push('/accounts');
                        }
                    }}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                    </Button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">API ID</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{account.api_id}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Security</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-primary" />
                            <span className="font-medium">2FA Enabled</span>
                            {/* Placeholder logic for 2FA */}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tasks Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-semibold">Tasks</h3>
                        <p className="text-sm text-muted-foreground">Scheduled jobs for this account</p>
                    </div>
                    <AddTaskDialog accountId={account.id} onTaskAdded={fetchData} />
                </div>

                <TaskList tasks={tasks} onRefresh={fetchData} />
            </div>
        </div>
    );
}
