import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-background">
            <aside className="w-64 hidden md:block">
                <Sidebar />
            </aside>
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
