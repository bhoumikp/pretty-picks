"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  clearCart,
  getCart,
  getCartTotal,
  removeCartItem,
  type CartItem,
  updateCartItem,
} from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { siteConfig } from "@/data/site";

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>(() => getCart());
  const total = useMemo(() => getCartTotal(items), [items]);
  const orderLink = useMemo(() => {
    if (items.length === 0) return "/contact";
    const lines = items
      .map((item, index) => {
        const link = `https://${siteConfig.domain}/products/${item.slug}`;
        return `${index + 1}. ${item.name} | Qty: ${item.quantity} | ${formatCurrency(
          item.price
        )} | Subtotal: ${formatCurrency(item.price * item.quantity)} | ${link}`;
      })
      .join("\n");
    const message = `Hi, I want to place an order:\n\n${lines}\n\nTotal: ${formatCurrency(total)}\n`;
    return buildWhatsAppLink(message);
  }, [items, total]);

  return (
    <div className="page-shell section-pad">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Cart</p>
          <h1 className="section-title">Your picks</h1>
        </div>
        {items.length > 0 && (
          <button className="btn-outline text-xs" onClick={() => {
            clearCart();
            setItems([]);
          }}>
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
          Your cart is empty. Explore products and add your favorites.
          <div className="mt-4">
            <Link href="/products" className="btn-primary text-xs">
              Browse products
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-3xl border border-[var(--pp-border)] bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="relative aspect-[3/2] w-full max-w-[200px] overflow-hidden rounded-2xl bg-[var(--pp-beige)]">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <Link href={`/products/${item.slug}`} className="text-sm font-semibold">
                    {item.name}
                  </Link>
                  <p className="text-xs text-[var(--pp-muted)]">{formatCurrency(item.price)}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-[var(--pp-border)] px-2 py-1 text-xs">
                      <button
                        className="h-6 w-6 rounded-full border border-[var(--pp-border)]"
                        onClick={() => setItems(updateCartItem(item.id, item.quantity - 1))}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="min-w-[18px] text-center font-semibold">{item.quantity}</span>
                      <button
                        className="h-6 w-6 rounded-full border border-[var(--pp-border)]"
                        onClick={() => setItems(updateCartItem(item.id, item.quantity + 1))}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-[var(--pp-muted)]">
                      Subtotal: {formatCurrency(item.price * item.quantity)}
                    </span>
                    <button
                      className="text-xs font-semibold text-[var(--pp-muted)] underline underline-offset-4"
                      onClick={() => setItems(removeCartItem(item.id))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-[var(--pp-border)] bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm text-[var(--pp-muted)]">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="font-semibold text-[var(--pp-ink)]">{formatCurrency(total)}</span>
              </div>
              <p className="text-xs">Shipping confirmed during checkout conversation.</p>
            </div>
            <div className="mt-6 space-y-3">
              <Link href="/products" className="btn-outline block text-center text-xs">
                Continue shopping
              </Link>
              <a href={orderLink} className="btn-primary block text-center text-xs">
                Contact us to place order
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
