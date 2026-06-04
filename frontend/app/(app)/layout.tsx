import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_15%_10%,rgba(79,70,229,0.10),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(129,140,248,0.10),transparent_24%),linear-gradient(135deg,#f8fafc_0%,#eef2f7_48%,#f8fafc_100%)]">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
