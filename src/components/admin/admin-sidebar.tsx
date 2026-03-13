import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-[var(--pp-border)] bg-white p-6 lg:flex">
      <h2 className="font-[var(--font-heading)] text-2xl">Admin</h2>
      <nav className="mt-8 flex flex-col gap-2 text-sm">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl px-3 py-2 transition hover:bg-[var(--pp-beige)]"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
