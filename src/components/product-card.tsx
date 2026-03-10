"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { primaryImage } from "@/lib/images";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { siteConfig } from "@/data/site";
import { toggleWishlist, isWishlisted } from "@/lib/wishlist";
import { trackEvent } from "@/lib/analytics";
import QuickViewModal from "@/components/quick-view-modal";
import type { ProductSummary } from "@/types/catalog";

interface ProductCardProps {
  product: ProductSummary;
  variant?: "grid" | "scroll";
}

export default function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const image = primaryImage(product.images);
  const productUrl = `https://${siteConfig.domain}/products/${product.slug}`;
  const message = `Hi, I want to order this product:\n\nProduct: ${product.name}\nPrice: ₹${product.price}\nQuantity: 1\nLink: ${productUrl}`;
  const whatsappLink = buildWhatsAppLink(message);
  const [wishlisted, setWishlisted] = useState(() => isWishlisted(product.id));
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const badge = product.featured
    ? "Best Seller"
    : product.price <= 199
    ? "Under ₹199"
    : product.stock && product.stock <= 5
    ? "Limited"
    : undefined;

  return (
    <div
      className={`soft-card card-hover group flex h-full flex-col overflow-hidden rounded-xl ${
        variant === "scroll" ? "min-w-[220px] snap-start" : ""
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--pp-beige)]">
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 z-0"
          onClick={() => trackEvent("product_click", { id: product.id })}
        >
          <span className="relative block h-full w-full">
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105"
            />
          </span>
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-all duration-300 group-hover:opacity-100" />
        {badge && (
          <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pp-ink)] shadow-sm">
            {badge}
          </span>
        )}
        <button
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow-sm transition-all hover:scale-105"
          onClick={() => {
            const next = toggleWishlist({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              image,
            });
            setWishlisted(next.some((item) => item.id === product.id));
            trackEvent("wishlist_toggle", { id: product.id });
          }}
        >
          <span className="sr-only">Add to wishlist</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor">
            <path
              d="M12 20s-6.5-4.35-8.5-7.5C1.5 9 3 6 6 6c2 0 3.5 1.5 6 4 2.5-2.5 4-4 6-4 3 0 4.5 3 2.5 6.5C18.5 15.65 12 20 12 20z"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="absolute inset-x-4 bottom-4 z-10 hidden translate-y-0 flex-col gap-2 opacity-0 transition-all duration-300 sm:flex sm:translate-y-6 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <button className="btn-outline text-center text-xs" onClick={() => setQuickViewOpen(true)}>
            Quick view
          </button>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-green-500 px-3 py-2 text-center text-xs font-semibold text-white transition-all duration-300 hover:bg-green-600"
            onClick={() => trackEvent("whatsapp_click", { id: product.id })}
          >
            Order on WhatsApp
          </a>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-3 py-3 sm:px-4 sm:py-4">
        <p className="text-[11px] uppercase tracking-[0.25em] text-[var(--pp-muted)]">
          {product.category?.name ?? "Pretty Picks"}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="min-h-[40px] text-sm font-semibold leading-snug tracking-tight sm:min-h-0 sm:text-base"
          onClick={() => trackEvent("product_click", { id: product.id })}
        >
          {product.name}
        </Link>
        <p className="text-base font-medium tracking-wide text-[var(--pp-gold)] sm:text-lg">
          {formatCurrency(product.price)}
        </p>
        <div className="mt-2 flex gap-2 sm:hidden">
          <button
            className="btn-outline flex-1 text-xs"
            onClick={() => setQuickViewOpen(true)}
          >
            Quick view
          </button>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-center text-xs font-semibold text-white transition-all duration-300 hover:bg-green-600"
            onClick={() => trackEvent("whatsapp_click", { id: product.id })}
          >
            WhatsApp
          </a>
        </div>
      </div>
      {quickViewOpen && (
        <QuickViewModal
          product={product}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </div>
  );
}
