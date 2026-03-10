"use client";

import Link from "next/link";
import { useState } from "react";
import { navigation, siteConfig } from "@/data/site";
import SearchBar from "@/components/search-bar";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navLinks = [
    { href: "/products", label: "Shop" },
    { href: "/category/earrings", label: "Earrings" },
    { href: "/category/necklaces", label: "Necklaces" },
    { href: "/category/rings", label: "Rings" },
    { href: "/category/bangles", label: "Bangles" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--pp-border)] bg-white/90 backdrop-blur">
      <div className="page-shell flex items-center justify-between py-4">
        <Link href="/" className="font-[var(--font-heading)] text-xl tracking-tight">
          {siteConfig.name}
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[var(--pp-gold)]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <SearchBar className="hidden w-64 md:block" />
          <button className="rounded-full border border-[var(--pp-border)] p-2 transition-all hover:shadow-sm">
            <span className="sr-only">Cart</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M7 4H5L3 18H19L21 8H7" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="17" cy="20" r="1.5" />
            </svg>
          </button>
          <Link
            href="/contact"
            className="rounded-full border border-[var(--pp-border)] px-4 py-2 text-xs font-semibold uppercase tracking-widest"
          >
            WhatsApp
          </Link>
        </div>
        <button
          className="rounded-full border border-[var(--pp-border)] p-2 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 6H20" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4 12H20" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4 18H20" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-[var(--pp-border)] bg-white md:hidden">
          <div className="page-shell flex flex-col gap-3 py-4 text-sm">
            <SearchBar className="w-full" />
            {[{ href: "/", label: "Home" }, ...navLinks, ...navigation.slice(6, 8)].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-1"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/products?price=199"
              className="btn-primary text-center text-sm"
              onClick={() => setOpen(false)}
            >
              Shop under ₹199
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
