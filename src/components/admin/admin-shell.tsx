"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/admin-sidebar";
import ToastStack from "@/components/ui/toast-stack";

const pageTitles = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/subcategories", label: "Sub Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminShell({
  children,
  initialCollapsed = false,
}: {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarCollapsed = useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => undefined;
      const handler = () => callback();
      window.addEventListener("storage", handler);
      window.addEventListener("pp-admin-sidebar", handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener("pp-admin-sidebar", handler);
      };
    },
    () => {
      if (typeof window === "undefined") return initialCollapsed;
      const cookieMatch = document.cookie.match(/(?:^|; )pp-admin-sidebar-collapsed=([^;]+)/);
      if (cookieMatch) return cookieMatch[1] === "1";
      return initialCollapsed;
    },
    () => initialCollapsed
  );
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type?: "success" | "error" | "warning" | "primary"; durationMs?: number }>
  >([]);

  const pageTitle = useMemo(() => {
    const match = pageTitles.find((item) => {
      if (item.href === "/admin") return pathname === "/admin";
      return pathname.startsWith(item.href);
    });
    return match?.label ?? "Admin";
  }, [pathname]);

  const pushToast = (
    message: string,
    type: "success" | "error" | "warning" | "primary" = "success"
  ) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const testToasts = () => {
    pushToast("Success toast", "success");
    pushToast("Error toast", "error");
    pushToast("Warning toast", "warning");
    pushToast("Primary toast", "primary");
  };

  const toggleSidebarCollapsed = () => {
    if (typeof window === "undefined") return;
    const next = !sidebarCollapsed;
    window.localStorage.setItem("pp-admin-sidebar-collapsed", next ? "1" : "0");
    document.cookie = `pp-admin-sidebar-collapsed=${next ? "1" : "0"}; path=/; max-age=31536000`;
    window.dispatchEvent(new Event("pp-admin-sidebar"));
  };

  return (
    <div
      className={`min-h-screen bg-[var(--pp-beige)] transition-[padding] duration-300 ease-out ${
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
      }`}
    >
      <AdminSidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--pp-border)] bg-white/80 px-6 py-4 backdrop-blur transition-[padding] duration-300 ease-out">
          <div className="flex w-full items-center justify-between">
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
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className="hidden h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)] lg:flex"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="4" height="16" rx="1.5" strokeWidth="1.6" />
                  <rect x="9" y="4" width="12" height="16" rx="1.5" strokeWidth="1.6" />
                  {sidebarCollapsed ? (
                    <path d="M14 9l4 3-4 3" strokeWidth="1.6" strokeLinecap="round" />
                  ) : (
                    <path d="M16 9l-4 3 4 3" strokeWidth="1.6" strokeLinecap="round" />
                  )}
                </svg>
              </button>
              <h1 className="text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn-outline admin-btn admin-btn-size"
                onClick={testToasts}
              >
                Test toasts
              </button>
              <form action="/api/auth/signout" method="post">
                <button className="btn-outline admin-btn admin-btn-size">Sign out</button>
              </form>
            </div>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 transition-[padding] duration-300 ease-out">
          {children}
        </main>
      </div>
      <ToastStack toasts={toasts} onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
