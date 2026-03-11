"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { navigation, siteConfig } from "@/data/site";
import SearchBar from "@/components/search-bar";
import { getCart } from "@/lib/cart";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const subscribe = (callback: () => void) => {
    if (typeof window === "undefined") return () => undefined;
    const handler = () => callback();
    window.addEventListener("pp-cart-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("pp-cart-updated", handler);
      window.removeEventListener("storage", handler);
    };
  };
  const getSnapshot = () =>
    getCart().reduce((sum, item) => sum + item.quantity, 0);
  const cartCount = useSyncExternalStore(subscribe, getSnapshot, () => 0);
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Shop" },
    { href: "/category/earrings", label: "Earrings" },
    { href: "/category/necklaces", label: "Necklaces" },
    { href: "/category/rings", label: "Rings" },
    { href: "/category/bangles", label: "Bangles" },
  ];

  const isActive = (href: string) => {
    if (href === "/products") return pathname === "/products" || pathname.startsWith("/products/");
    if (href.startsWith("/category/")) return pathname === href;
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--pp-border)] bg-[var(--pp-white)]/85 backdrop-blur">
      <div className="page-shell flex items-center justify-between py-4 md:py-5">
        <div className="flex items-center gap-3">
          <button
            className="rounded-full border border-[var(--pp-border)] p-2 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 6H20" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M4 12H20" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M4 18H20" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <Link href="/" className="font-[var(--font-heading)] text-2xl tracking-tight">
            {siteConfig.name}
          </Link>
        </div>
        <nav className="hidden items-center gap-8 text-sm lg:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`border-b-2 pb-1 transition-all duration-300 ${
                isActive(item.href)
                  ? "border-[var(--pp-gold)] text-[var(--pp-ink)]"
                  : "border-transparent text-[var(--pp-ink)] hover:border-[var(--pp-gold)] hover:text-[var(--pp-gold)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <SearchBar className="w-56 xl:w-64" />
          <Link
            href="/cart"
            className="relative rounded-full border border-[var(--pp-border)] p-2 transition-all hover:shadow-sm"
          >
            <span className="sr-only">Cart</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M7 4H5L3 18H19L21 8H7" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="17" cy="20" r="1.5" />
            </svg>
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="badge-pop absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--pp-gold)] px-1 text-[10px] font-semibold text-[var(--pp-ink)]"
              >
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-[var(--pp-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition hover:border-[var(--pp-gold)]"
          >
            Contact Us
          </Link>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="font-[var(--font-heading)] text-lg">Menu</p>
              <button
                className="rounded-full border border-[var(--pp-border)] p-2"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <div className="mt-6 space-y-4 text-sm">
              <SearchBar className="w-full" />
              {[{ href: "/", label: "Home" }, ...navLinks, ...navigation.slice(7, 9)].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block border-b border-[var(--pp-border)] pb-3 text-base"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/products?price=199"
                className="btn-primary block text-center text-sm"
                onClick={() => setOpen(false)}
              >
                Shop under ₹199
              </Link>
              <Link
                href="/contact"
                className="btn-outline block text-center text-sm"
                onClick={() => setOpen(false)}
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
