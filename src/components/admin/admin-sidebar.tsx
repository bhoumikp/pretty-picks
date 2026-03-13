"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
}

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
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
            aria-current={isActive ? "page" : undefined}
            onClick={() => onClose?.()}
            className={`flex items-center justify-between border-l-2 px-3 py-2 transition ${
              isActive
                ? "border-[var(--pp-gold)] bg-[var(--pp-beige)] text-[var(--pp-ink)]"
                : "border-transparent text-[var(--pp-muted)] hover:border-[var(--pp-gold)]/40 hover:bg-[var(--pp-beige)]/70 hover:text-[var(--pp-ink)]"
            }`}
          >
            <span>{link.label}</span>
            {isActive && <span className="text-xs text-[var(--pp-gold)]">●</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-[var(--pp-border)] bg-white px-6 py-8 lg:flex">
        <div>
          <h2 className="text-2xl font-[var(--font-heading)] text-[var(--pp-ink)]">
            Pretty Picks
          </h2>
        </div>
        <div className="mt-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--pp-muted)]">Navigation</p>
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
          className={`absolute left-0 top-0 h-full w-72 border-r border-[var(--pp-border)] bg-white px-6 py-8 transition-transform ${
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
