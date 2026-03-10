"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/products/")) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--pp-border)] bg-white/95 backdrop-blur md:hidden">
      <div className="flex items-center justify-around py-3 text-xs">
        <Link href="/" className="flex flex-col items-center gap-1">
          <span>Home</span>
        </Link>
        <Link href="/products" className="flex flex-col items-center gap-1">
          <span>Shop</span>
        </Link>
        <Link href="/wishlist" className="flex flex-col items-center gap-1">
          <span>Wishlist</span>
        </Link>
        <Link href="/contact" className="flex flex-col items-center gap-1">
          <span>WhatsApp</span>
        </Link>
      </div>
    </div>
  );
}
