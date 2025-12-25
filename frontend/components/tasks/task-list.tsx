"use client";

import { useState } from "react";
import { Play, Trash2, Edit, Calendar, CheckCircle2, XCircle, RotateCw } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"; // Need to create Table component
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast"; // Need to create UseToast

interface Task {
    id: number;
    name: string;
    cron: string;
    enabled: boolean;
    last_run_at: string | null;
    created_at: string;
}

interface TaskListProps {
    tasks: Task[];
    onRefresh: () => void;
}

export function TaskList({ tasks, onRefresh }: TaskListProps) {
    // const { toast } = useToast();
    const [runningId, setRunningId] = useState<number | null>(null);

    const handleRunTask = async (taskId: number) => {
        setRunningId(taskId);
        try {
            const res = await fetch(`/api/tasks/${taskId}/run`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to run task');
            // toast({ title: "Task started", description: "Check logs for output" });
            onRefresh();
        } catch (error) {
            // toast({ title: "Error", description: "Failed to run task", variant: "destructive" });
        } finally {
            setRunningId(null);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            onRefresh();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Cron</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Run</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No tasks configured.
                            </TableCell>
                        </TableRow>
                    ) : (
                        tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.name}</TableCell>
                                <TableCell className="font-mono text-xs">{task.cron}</TableCell>
                                <TableCell>
                                    <Badge variant={task.enabled ? "default" : "secondary"}>
                                        {task.enabled ? "Active" : "Disabled"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {task.last_run_at ? (
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(task.last_run_at), "MMM d, HH:mm")}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRunTask(task.id)}
                                        disabled={runningId === task.id}
                                    >
                                        <Play className={`h-3 w-3 ${runningId === task.id ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
