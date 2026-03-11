"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getCart } from "@/lib/cart";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  const linkBase =
    "flex h-10 w-10 items-center justify-center rounded-full transition";
  const activeClasses =
    "bg-[var(--pp-beige)] text-[var(--pp-gold)] ring-1 ring-[var(--pp-border)]";
  const idleClasses = "text-[var(--pp-ink)]";
  const isHome = pathname === "/";
  const isShop = pathname === "/products";
  const isWishlist = pathname === "/wishlist";
  const isCart = pathname === "/cart";
  const isCategories = pathname === "/categories" || (isHome && hash === "#categories");

  if (pathname.startsWith("/products/")) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--pp-border)] bg-white/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-around py-3">
        <Link
          href="/"
          aria-label="Home"
          title="Home"
          aria-current={isHome ? "page" : undefined}
          className={`${linkBase} ${isHome ? activeClasses : idleClasses}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 10.5L12 4l9 6.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 10v8a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link
          href="/products"
          aria-label="Shop"
          title="Shop"
          aria-current={isShop ? "page" : undefined}
          className={`${linkBase} ${isShop ? activeClasses : idleClasses}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 7h12l-1 12H7L6 7z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 7V5a3 3 0 0 1 6 0v2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link
          href="/categories"
          aria-label="Categories"
          title="Categories"
          className={`${linkBase} ${isCategories ? activeClasses : idleClasses}`}
          onClick={() => setHash("")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="8" height="8" rx="1.5" strokeWidth="1.6" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" strokeWidth="1.6" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" strokeWidth="1.6" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" strokeWidth="1.6" />
          </svg>
        </Link>
        <Link
          href="/wishlist"
          aria-label="Wishlist"
          title="Wishlist"
          aria-current={isWishlist ? "page" : undefined}
          className={`${linkBase} ${isWishlist ? activeClasses : idleClasses}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 20s-6.5-4.35-8.5-7.5C1.5 9 3 6 6 6c2 0 3.5 1.5 6 4 2.5-2.5 4-4 6-4 3 0 4.5 3 2.5 6.5C18.5 15.65 12 20 12 20z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link
          href="/cart"
          aria-label="Cart"
          title="Cart"
          aria-current={isCart ? "page" : undefined}
          className={`${linkBase} relative ${isCart ? activeClasses : idleClasses}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M7 4H5L3 18H19L21 8H7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="17" cy="20" r="1.5" />
          </svg>
          {cartCount > 0 && (
            <span className="badge-pop absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--pp-gold)] px-1 text-[10px] font-semibold text-[var(--pp-ink)]">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
