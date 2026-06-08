import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}