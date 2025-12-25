"use client";

import { useState } from "react";
import { Shield, Key, Database, Save, Server } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Need to create Tabs

export default function SettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Change Password State
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Mock API call - need to implement backend endpoint if not exists
            // Assuming POST /api/user/change-password
            const res = await fetch("/api/user/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
            });
            if (res.ok) {
                toast({ title: "Success", description: "Password updated successfully" });
                setOldPassword("");
                setNewPassword("");
            } else {
                throw new Error("Failed");
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to update password", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
                <p className="text-muted-foreground">Manage your credentials and system configurations.</p>
            </div>

            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle>Security</CardTitle>
                        </div>
                        <CardDescription>Update your login password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <Label htmlFor="current">Current Password</Label>
                                <Input
                                    id="current" type="password"
                                    value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new">New Password</Label>
                                <Input
                                    id="new" type="password"
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading && <Server className="mr-2 h-4 w-4 animate-spin" />}
                                Update Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-primary" />
                            <CardTitle>System Config</CardTitle>
                        </div>
                        <CardDescription>Global variables and environment settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground italic">
                            Config management UI coming soon.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
