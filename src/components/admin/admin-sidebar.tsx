"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Layers,
  LayoutGrid,
  Settings as SettingsIcon,
  ChevronDown,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { useMemo, useState } from "react";

const navIcons: Record<string, React.ReactElement> = {
  Dashboard: <LayoutGrid className="h-4 w-4" />,
  Products: <Boxes className="h-4 w-4" />,
  Categories: <Layers className="h-4 w-4" />,
  Orders: <ShoppingBag className="h-4 w-4" />,
  "Audit Logs": <FileText className="h-4 w-4" />,
  Settings: <SettingsIcon className="h-4 w-4" />,
};

type AdminNavLink = {
  href: string;
  label: string;
  children?: Array<{ href: string; label: string }>;
};

const adminLinks: AdminNavLink[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  {
    href: "/admin/categories",
    label: "Categories",
    children: [
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/subcategories", label: "Sub Categories" },
    ],
  },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/admin/settings", label: "Settings" },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onTestToasts?: () => void;
}

export default function AdminSidebar({
  mobileOpen = false,
  onClose,
  collapsed = false,
  onTestToasts,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const shouldPrefetch = process.env.NODE_ENV === "production";

  const activeSection = useMemo(() => {
    return (
      adminLinks.find(
        (link) =>
          link.children?.some((child) => pathname === child.href || pathname.startsWith(child.href))
      )?.href ?? null
    );
  }, [pathname]);

  const effectiveOpenSection = openSection ?? activeSection;
  const activeParent = activeSection;

  const renderLinks = () => (
    <nav className="mt-4 flex flex-col gap-1 text-sm">
      {adminLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/admin" && pathname.startsWith(link.href));
        const hasChildren = Boolean(link.children?.length);
        const isChildActive = link.children?.some(
          (child) => pathname === child.href || pathname.startsWith(child.href)
        );

        return (
          <div key={link.href} className="flex flex-col">
            {hasChildren ? (
              <div className="flex items-center">
                <Link
                  href={link.href}
                  prefetch={shouldPrefetch}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onClose?.()}
                  onMouseEnter={() => shouldPrefetch && router.prefetch(link.href)}
                  onFocus={() => shouldPrefetch && router.prefetch(link.href)}
                  title={link.label}
                  className={`group flex flex-1 items-center border-l-2 px-3 py-2 transition ${
                    isActive || isChildActive
                      ? "border-[var(--pp-gold)] bg-[var(--pp-beige)] text-[var(--pp-ink)] font-semibold"
                      : "border-transparent text-[var(--pp-muted)] hover:border-[var(--pp-gold)]/40 hover:bg-[var(--pp-beige)]/70 hover:text-[var(--pp-ink)]"
                  }`}
                >
                  <span
                    className={`relative flex items-center ${collapsed ? "justify-center" : "gap-3"} w-full`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isActive || isChildActive
                          ? "bg-[var(--pp-gold)]/20 text-[var(--pp-ink)]"
                          : "bg-[var(--pp-border)]/40"
                      }`}
                    >
                      {navIcons[link.label]}
                    </span>
                    <span
                      className={`${collapsed ? "lg:hidden" : ""} ${
                        isChildActive ? "text-[var(--pp-ink)]" : ""
                      }`}
                    >
                      {link.label}
                    </span>
                    {collapsed && (
                      <span className="pointer-events-none absolute left-12 top-1/2 hidden -translate-y-1/2 whitespace-nowrap border border-[var(--pp-border)] bg-white px-2.5 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:opacity-100 lg:block">
                        {link.label}
                      </span>
                    )}
                  </span>
                  {!collapsed && (isActive || isChildActive) && (
                    <span className="ml-auto text-xs text-[var(--pp-gold)]">●</span>
                  )}
                </Link>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSection((prev) =>
                        prev === link.href ? null : activeParent && activeParent !== link.href ? null : link.href
                      )
                    }
                    title={`${link.label} menu`}
                    aria-expanded={effectiveOpenSection === link.href}
                    className="flex h-10 w-10 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition ${
                        effectiveOpenSection === link.href ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            ) : (
              <Link
                href={link.href}
                prefetch={shouldPrefetch}
                aria-current={isActive ? "page" : undefined}
                onClick={() => onClose?.()}
                onMouseEnter={() => shouldPrefetch && router.prefetch(link.href)}
                onFocus={() => shouldPrefetch && router.prefetch(link.href)}
                title={link.label}
                className={`group flex items-center border-l-2 px-3 py-2 transition ${
                  isActive
                    ? "border-[var(--pp-gold)] bg-[var(--pp-beige)] text-[var(--pp-ink)]"
                    : "border-transparent text-[var(--pp-muted)] hover:border-[var(--pp-gold)]/40 hover:bg-[var(--pp-beige)]/70 hover:text-[var(--pp-ink)]"
                }`}
              >
                <span
                  className={`relative flex items-center ${collapsed ? "justify-center" : "gap-3"} w-full`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isActive ? "bg-[var(--pp-gold)]/15 text-[var(--pp-ink)]" : "bg-[var(--pp-border)]/40"
                    }`}
                  >
                    {navIcons[link.label]}
                  </span>
                  <span className={`${collapsed ? "lg:hidden" : ""}`}>{link.label}</span>
                  {collapsed && (
                    <span className="pointer-events-none absolute left-12 top-1/2 hidden -translate-y-1/2 whitespace-nowrap border border-[var(--pp-border)] bg-white px-2.5 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:opacity-100 lg:block">
                      {link.label}
                    </span>
                  )}
                </span>
                {!collapsed && isActive && <span className="text-xs text-[var(--pp-gold)]">●</span>}
              </Link>
            )}
            {collapsed && hasChildren && (
              <div className="relative ml-3 mt-2 flex flex-col gap-2 border-l border-[var(--pp-border)]/60 pl-3">
                  {link.children?.map((child) => {
                    const childActive = pathname === child.href || pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        prefetch={shouldPrefetch}
                        onClick={() => {
                          setOpenSection(null);
                          onClose?.();
                        }}
                        onMouseEnter={() => shouldPrefetch && router.prefetch(child.href)}
                        onFocus={() => shouldPrefetch && router.prefetch(child.href)}
                        className={`group relative flex items-center gap-2 px-2 py-1 text-[10px] uppercase tracking-[0.2em] transition ${
                          childActive
                            ? "text-[var(--pp-ink)]"
                            : "text-[var(--pp-muted)] hover:text-[var(--pp-ink)]"
                        }`}
                    >
                      <span
                        className={`h-[6px] w-[6px] ${
                          childActive ? "bg-[var(--pp-gold)]" : "bg-[var(--pp-ink)]/30"
                        }`}
                      />
                      <span
                        className={`ml-1 flex h-7 min-w-[36px] items-center justify-center rounded-full border px-3 text-[12px] font-semibold ${
                          childActive
                            ? "border-[var(--pp-gold)]/70 bg-[var(--pp-gold)]/15 text-[var(--pp-ink)]"
                            : "border-[var(--pp-border)] bg-white text-[var(--pp-ink)]"
                        }`}
                      >
                        {child.label
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <span className="lg:sr-only">{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
            {!collapsed && hasChildren && (
              <div
                className={`ml-10 overflow-hidden transition-all duration-500 ${
                  effectiveOpenSection === link.href ? "mt-2 max-h-40 opacity-100" : "max-h-0 opacity-0"
                }`}
                aria-hidden={effectiveOpenSection !== link.href}
              >
                <div className="flex flex-col gap-2">
                  {link.children?.map((child) => {
                    const childActive = pathname === child.href || pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        prefetch={shouldPrefetch}
                        onClick={() => {
                          setOpenSection(null);
                          onClose?.();
                        }}
                        onMouseEnter={() => shouldPrefetch && router.prefetch(child.href)}
                        onFocus={() => shouldPrefetch && router.prefetch(child.href)}
                        className={`flex items-center gap-2 border-l-2 px-3 py-2 text-xs uppercase tracking-[0.22em] transition ${
                          childActive
                            ? "border-[var(--pp-gold)] text-[var(--pp-ink)]"
                            : "border-transparent text-[var(--pp-muted)] hover:border-[var(--pp-gold)]/40 hover:text-[var(--pp-ink)]"
                        }`}
                      >
                        <span className="text-[10px] text-[var(--pp-muted)]">•</span>
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside
        className={`hidden h-screen flex-col border-r border-[var(--pp-border)] bg-white py-8 transition-[width,padding] duration-300 ease-out lg:fixed lg:left-0 lg:top-0 lg:z-20 lg:flex lg:overflow-y-auto ${
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
        <div className={`mt-auto pt-6 ${collapsed ? "lg:pb-2" : ""}`}>
          <button
            type="button"
            onClick={onTestToasts}
            className={`btn-outline admin-btn admin-btn-size w-full ${collapsed ? "lg:w-12 lg:px-0" : ""}`}
            aria-label="Test toasts"
          >
            <span className={`${collapsed ? "lg:hidden" : ""}`}>Test toasts</span>
            {collapsed && <span className="hidden text-xs lg:inline">TT</span>}
          </button>
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
          className={`absolute left-0 top-0 flex h-full w-[84vw] max-w-[18rem] flex-col border-r border-[var(--pp-border)] bg-white px-6 py-8 transition-transform ${
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
          <div className="mt-auto pt-6">
            <button
              type="button"
              onClick={() => {
                onTestToasts?.();
                onClose?.();
              }}
              className="btn-outline admin-btn admin-btn-size w-full"
            >
              Test toasts
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
