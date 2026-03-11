"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getWishlist, toggleWishlist, type WishlistItem } from "@/lib/wishlist";

export default function WishlistClient() {
  const [items, setItems] = useState<WishlistItem[]>(() => getWishlist());

  useEffect(() => {
    const handler = () => setItems(getWishlist());
    window.addEventListener("pp-wishlist-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("pp-wishlist-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return (
    <div className="page-shell section-pad">
      <div className="mb-6">
        <p className="eyebrow">Wishlist</p>
        <h1 className="section-title">Saved picks</h1>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
          Your wishlist is empty. Explore products and tap the heart icon.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="soft-card rounded-xl p-4 transition-all duration-300 hover:shadow-lg"
            >
              <Link href={`/products/${item.slug}`}>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--pp-beige)]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <p className="mt-3 text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-[var(--pp-muted)]">₹{item.price}</p>
              </Link>
              <button
                className="mt-3 text-xs font-semibold text-[var(--pp-muted)] underline underline-offset-4"
                onClick={() => {
                  const next = toggleWishlist(item);
                  setItems(next);
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
