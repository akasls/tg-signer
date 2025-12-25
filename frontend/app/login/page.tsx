"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"phone" | "code" | "password">("phone");
    const [loading, setLoading] = useState(false);

    // Form State
    const [accountName, setAccountName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState(""); // Not used for panel login, but for TG login. 
    // Wait, panel login is different from TG login.
    // The original project had "User Login" (to panel) AND "Account Login" (TG).
    // I need to check backend/api/routes/user.py closely. 
    // Assuming this is PANEL login (admin/password).

    // Re-reading user request: "User logs in from main domain".
    // The backend has `POST /api/auth/login` (OAuth2).
    // So this page is for PANEL LOGIN.

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) throw new Error("Login failed");

            const data = await res.json();
            localStorage.setItem("token", data.access_token);
            router.push("/dashboard");
        } catch (error) {
            console.error(error);
            alert("Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-50 animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                <Card className="border-border/50 backdrop-blur-sm bg-card/80 shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                        <CardDescription>Sign in to your management panel</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="admin"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary">Forgot?</span>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full h-11 text-base group" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
