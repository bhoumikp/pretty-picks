"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Layers,
  LayoutGrid,
  Settings as SettingsIcon,
  ShoppingBag,
  Users,
} from "lucide-react";

const navIcons: Record<string, React.ReactElement> = {
  Dashboard: <LayoutGrid className="h-4 w-4" />,
  Products: <Boxes className="h-4 w-4" />,
  Categories: <Layers className="h-4 w-4" />,
  Orders: <ShoppingBag className="h-4 w-4" />,
  Contacts: <Users className="h-4 w-4" />,
  Settings: <SettingsIcon className="h-4 w-4" />,
};

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/settings", label: "Settings" },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
}

export default function AdminSidebar({
  mobileOpen = false,
  onClose,
  collapsed = false,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const renderLinks = () => (
    <nav className="mt-4 flex flex-col gap-1 text-sm">
      {adminLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/admin" && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch
            aria-current={isActive ? "page" : undefined}
            onClick={() => onClose?.()}
            title={link.label}
            className={`group flex items-center border-l-2 px-3 py-2 transition ${
              isActive
                ? "border-[var(--pp-gold)] bg-[var(--pp-beige)] text-[var(--pp-ink)]"
                : "border-transparent text-[var(--pp-muted)] hover:border-[var(--pp-gold)]/40 hover:bg-[var(--pp-beige)]/70 hover:text-[var(--pp-ink)]"
            }`}
          >
            <span className={`relative flex items-center ${collapsed ? "justify-center" : "gap-3"} w-full`}>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isActive ? "bg-[var(--pp-gold)]/15 text-[var(--pp-ink)]" : "bg-[var(--pp-border)]/40"
                }`}
              >
                {navIcons[link.label]}
              </span>
              <span className={`${collapsed ? "lg:hidden" : ""}`}>{link.label}</span>
              {collapsed && (
                <span className="pointer-events-none absolute left-12 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-[var(--pp-border)] bg-white px-2.5 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:opacity-100 lg:block">
                  {link.label}
                </span>
              )}
            </span>
            {!collapsed && isActive && <span className="text-xs text-[var(--pp-gold)]">●</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside
        className={`hidden h-screen flex-col border-r border-[var(--pp-border)] bg-white py-8 lg:fixed lg:left-0 lg:top-0 lg:z-20 lg:flex lg:overflow-y-auto ${
          collapsed ? "lg:w-20 lg:px-3" : "lg:w-72 lg:px-6"
        }`}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <h2
            className={`text-2xl font-[var(--font-heading)] text-[var(--pp-ink)] ${
              collapsed ? "lg:sr-only" : ""
            }`}
          >
            Pretty Picks
          </h2>
          {collapsed && (
            <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-[var(--pp-beige)] text-sm font-semibold text-[var(--pp-ink)] lg:flex">
              PP
            </span>
          )}
        </div>
        <div className="mt-10">
          <p
            className={`text-[11px] uppercase tracking-[0.3em] text-[var(--pp-muted)] ${
              collapsed ? "lg:sr-only" : ""
            }`}
          >
            Navigation
          </p>
          {renderLinks()}
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[84vw] max-w-[18rem] border-r border-[var(--pp-border)] bg-white px-6 py-8 transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-[var(--font-heading)] text-[var(--pp-ink)]">
              Pretty Picks
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
              aria-label="Close sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 6l12 12" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M18 6l-12 12" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="mt-10">
            <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--pp-muted)]">Navigation</p>
            {renderLinks()}
          </div>
        </aside>
      </div>
    </>
  );
}
