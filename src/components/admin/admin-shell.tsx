"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/admin-sidebar";

const pageTitles = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = useMemo(() => {
    const match = pageTitles.find((item) => {
      if (item.href === "/admin") return pathname === "/admin";
      return pathname.startsWith(item.href);
    });
    return match?.label ?? "Admin";
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[var(--pp-beige)]">
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--pp-border)] bg-white/80 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)] lg:hidden"
                aria-label="Open sidebar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 6h18" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M3 12h18" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M3 18h18" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
              <h1 className="text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">
                {pageTitle}
              </h1>
            </div>
            <form action="/api/auth/signout" method="post">
              <button className="btn-outline text-sm">Sign out</button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
