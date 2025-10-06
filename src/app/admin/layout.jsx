import Sidebar from "./Sidebar";

export const metadata = { title: "Admin" };

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      {/* Left sidebar, right content */}
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-white shadow-sm">
          <Sidebar />
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}




