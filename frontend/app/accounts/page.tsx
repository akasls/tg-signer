"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Types (mocking for now, normally in types/index.ts)
interface Account {
    name: string;
    size: number;
    exists: boolean;
    session_file: string;
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Replace with real API call
        fetch("/api/accounts")
            .then((res) => {
                if (res.ok) return res.json();
                // Fallback if API not proxying yet during dev
                return { accounts: [] };
            })
            .then((data) => {
                setAccounts(data.accounts || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
                    <p className="text-muted-foreground">Manage your connected Telegram accounts.</p>
                </div>
                <Link href="/accounts/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Account
                    </Button>
                </Link>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search accounts..." className="pl-9" />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    // Skeleton loading state
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="opacity-50 animate-pulse h-48" />
                    ))
                ) : accounts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No accounts found. Add one to get started.
                    </div>
                ) : (
                    accounts.map((account) => (
                        <Link key={account.name} href={`/accounts/view?name=${account.name}`}>
                            <Card className="hover:border-primary/50 transition-colors cursor-pointer group card-hover">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="flex items-center gap-2">
                                                {account.name}
                                            </CardTitle>
                                            <CardDescription className="font-mono text-xs truncate max-w-[200px]">
                                                {account.session_file}
                                            </CardDescription>
                                        </div>
                                        <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                                            <Smartphone className="h-5 w-5 text-primary" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground">
                                        Status: <span className="text-green-500 font-medium">Active</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
