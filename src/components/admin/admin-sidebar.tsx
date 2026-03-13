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

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-[var(--pp-border)] bg-white px-6 py-8 lg:flex">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--pp-muted)]">Admin panel</p>
        <h2 className="mt-3 text-2xl font-[var(--font-heading)] text-[var(--pp-ink)]">
          Pretty Picks
        </h2>
      </div>
      <div className="mt-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--pp-muted)]">Navigation</p>
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
      </div>
    </aside>
  );
}
