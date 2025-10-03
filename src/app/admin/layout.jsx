// src/app/admin/layout.jsx
export const metadata = { title: 'Admin' };

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-[240px,1fr]">
        <aside className="md:min-h-screen p-4 md:p-6">
          <div className="sticky top-4 rounded-2xl border bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow-sm p-4">
            <div className="text-lg font-semibold mb-4">Wedding Admin</div>
            <nav className="space-y-1 text-sm">
              <a className="block rounded-lg px-3 py-2 bg-indigo-600 text-white">Dashboard</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" href="#">Guests</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" href="#">Emails</a>
              <a className="block rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800" href="#">Settings</a>
            </nav>
          </div>
        </aside>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
