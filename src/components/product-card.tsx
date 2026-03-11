"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { primaryImage } from "@/lib/images";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { siteConfig } from "@/data/site";
import { toggleWishlist, getWishlist, type WishlistItem } from "@/lib/wishlist";
import { getCart, setCartItemQuantity, type CartItem } from "@/lib/cart";
import { trackEvent } from "@/lib/analytics";
import QuickViewModal from "@/components/quick-view-modal";
import type { ProductSummary } from "@/types/catalog";

interface ProductCardProps {
  product: ProductSummary;
  variant?: "grid" | "scroll" | "carousel";
}

export default function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const image = primaryImage(product.images);
  const productUrl = `https://${siteConfig.domain}/products/${product.slug}`;
  const message = `Hi, I want to order this product:\n\nProduct: ${product.name}\nPrice: ₹${product.price}\nQuantity: 1\nLink: ${productUrl}`;
  const whatsappLink = buildWhatsAppLink(message);
  const [wishlisted, setWishlisted] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [cartQty, setCartQty] = useState(0);
  const [added, setAdded] = useState(false);

  const badge = product.featured
    ? "Best Seller"
    : product.price <= 199
    ? "Under ₹199"
    : product.stock && product.stock <= 5
    ? "Limited"
    : undefined;

  useEffect(() => {
    const readCart = (items?: CartItem[]) => {
      const current = items ?? getCart();
      const entry = current.find((item) => item.id === product.id);
      const nextQty = entry?.quantity ?? 0;
      setCartQty(nextQty);
      setQuantity(nextQty);
    };

    const readWishlist = (items?: WishlistItem[]) => {
      const current = items ?? getWishlist();
      setWishlisted(current.some((item) => item.id === product.id));
    };

    readCart();
    readWishlist();

    const cartHandler = (event: Event) => {
      const customEvent = event as CustomEvent<CartItem[]>;
      readCart(customEvent.detail);
    };
    const wishlistHandler = (event: Event) => {
      const customEvent = event as CustomEvent<WishlistItem[]>;
      readWishlist(customEvent.detail);
    };
    const storageCartHandler = () => readCart();
    const storageWishlistHandler = () => readWishlist();

    window.addEventListener("pp-cart-updated", cartHandler);
    window.addEventListener("pp-wishlist-updated", wishlistHandler);
    window.addEventListener("storage", storageCartHandler);
    window.addEventListener("storage", storageWishlistHandler);
    return () => {
      window.removeEventListener("pp-cart-updated", cartHandler);
      window.removeEventListener("pp-wishlist-updated", wishlistHandler);
      window.removeEventListener("storage", storageCartHandler);
      window.removeEventListener("storage", storageWishlistHandler);
    };
  }, [product.id]);

  return (
    <div
      className={`group flex h-full flex-col rounded-2xl border border-[var(--pp-border)] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0 hover:shadow-lg ${
        variant === "scroll"
          ? "min-w-[240px] snap-start sm:min-w-[260px] md:min-w-[280px] lg:min-w-0"
          : ""
      } ${
        variant === "carousel"
          ? "min-w-full shrink-0 snap-start basis-full sm:min-w-[50%] sm:basis-1/2 md:min-w-[33.333%] md:basis-1/3 lg:min-w-[25%] lg:basis-1/4"
          : ""
      }`}
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-t-2xl bg-[var(--pp-beige)]">
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
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100" />
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pp-ink)] shadow-sm">
            {badge}
          </span>
        )}
        <button
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-sm transition-all hover:scale-105"
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
        <div className="absolute inset-x-3 bottom-3 z-10 hidden translate-y-0 flex-col gap-2 opacity-0 transition-all duration-300 sm:flex sm:translate-y-6 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <button
            className="btn-outline cursor-pointer text-center text-xs"
            onClick={() => setQuickViewOpen(true)}
          >
            Quick view
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--pp-muted)]">
          {product.category?.name ?? "Pretty Picks"}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-semibold leading-snug tracking-tight sm:min-h-0 sm:text-base"
          onClick={() => trackEvent("product_click", { id: product.id })}
        >
          {product.name}
        </Link>
        <p className="text-base font-semibold tracking-wide text-[var(--pp-ink)] sm:text-lg">
          {formatCurrency(product.price)}
        </p>
      </div>
      <div className="mt-auto border-t border-[var(--pp-border)] px-4 pb-4 pt-3">
        <div className="flex flex-col items-stretch gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-2 rounded-full border border-[var(--pp-border)] px-2 py-1 sm:justify-start">
            <button
              className="h-6 w-6 text-sm cursor-pointer"
              onClick={() => {
                const currentQty = cartQty > 0 ? cartQty : quantity;
                if (currentQty <= 0) {
                  return;
                }
                const nextQty = Math.max(0, currentQty - 1);
                const next = setCartItemQuantity(
                  {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    image,
                  },
                  nextQty
                );
                const entry = next.find((item) => item.id === product.id);
                const resolvedQty = entry?.quantity ?? 0;
                setCartQty(resolvedQty);
                setQuantity(resolvedQty);
                trackEvent("cart_qty_decrease", { id: product.id, quantity: resolvedQty });
                setAdded(true);
                window.setTimeout(() => setAdded(false), 600);
              }}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span
              key={cartQty > 0 ? cartQty : quantity}
              className="qty-pop min-w-[16px] text-center text-xs font-semibold"
            >
              {cartQty > 0 ? cartQty : quantity}
            </span>
            <button
              className="h-6 w-6 text-sm cursor-pointer"
              onClick={() => {
                const currentQty = cartQty > 0 ? cartQty : quantity;
                if (currentQty >= 10) {
                  return;
                }
                const nextQty = Math.min(10, currentQty + 1);
                const next = setCartItemQuantity(
                  {
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    image,
                  },
                  nextQty
                );
                const entry = next.find((item) => item.id === product.id);
                const resolvedQty = entry?.quantity ?? nextQty;
                setCartQty(resolvedQty);
                setQuantity(resolvedQty);
                trackEvent("cart_qty_increase", { id: product.id, quantity: resolvedQty });
                setAdded(true);
                window.setTimeout(() => setAdded(false), 600);
              }}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            className={`rounded-full border px-6 py-3 text-xs font-semibold transition-all sm:px-7 cursor-pointer ${
              cartQty > 0
                ? "border-[var(--pp-gold)] bg-[var(--pp-gold)] text-[var(--pp-ink)] shadow-sm"
                : "border-[var(--pp-border)] bg-white/70 text-[var(--pp-ink)] hover:bg-[var(--pp-beige)]"
            } ${added ? "cart-pop-strong ring-2 ring-[var(--pp-gold)]/35" : ""}`}
            onClick={() => {
              const targetQty = cartQty > 0 ? 0 : Math.max(1, quantity);
              const next = setCartItemQuantity(
                {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  image,
                },
                targetQty
              );
              const entry = next.find((item) => item.id === product.id);
              const nextQty = entry?.quantity ?? 0;
              setCartQty(nextQty);
              setQuantity(nextQty);
              if (nextQty > 0) {
                trackEvent("add_to_cart", { id: product.id, quantity: nextQty });
              } else {
                trackEvent("remove_from_cart", { id: product.id });
              }
              setAdded(true);
              window.setTimeout(() => setAdded(false), 600);
            }}
          >
            <span className="sr-only">{cartQty > 0 ? "In cart" : "Add to cart"}</span>
            {cartQty > 0 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 4H5L3 18H19L21 8H7" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                <path d="M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                <path d="m9 11 2 2 4-4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M7 4H5L3 18H19L21 8H7" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                <path d="M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                <path d="M9 12h6" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
        {/* <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-3 block text-center text-xs"
          onClick={() => trackEvent("whatsapp_click", { id: product.id })}
        >
          Order on WhatsApp
        </a> */}
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
