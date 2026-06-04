import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,0.10),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(14,165,233,0.10),transparent_24%),linear-gradient(135deg,#f8fafc_0%,#eef2f7_48%,#f8fafc_100%)]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
