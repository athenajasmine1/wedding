'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const linkClasses = (href) =>
    `block rounded-lg px-3 py-2 text-sm mb-1 ${
      pathname.includes(href)
        ? "bg-indigo-600 text-white"
        : "hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-lg font-semibold mb-6">Wedding Admin</h2>
      <nav className="flex-1 space-y-1">
        <Link href="/admin/adminpage" className={linkClasses("adminpage")}>
          Home
        </Link>
        <Link href="/admin/guests" className={linkClasses("guests")}>
          Guests 
        </Link>
        
      </nav>
      <button
        onClick={handleLogout}
        className="mt-auto rounded-lg border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        Log out
      </button>
    </div>
  );
}

