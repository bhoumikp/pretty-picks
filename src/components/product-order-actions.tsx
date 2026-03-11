"use client";

import { useMemo, useState } from "react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatCurrency } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { setCartItemQuantity } from "@/lib/cart";

interface ProductOrderActionsProps {
  id: string;
  name: string;
  price: number;
  productUrl: string;
  image: string;
}

export default function ProductOrderActions({
  id,
  name,
  price,
  productUrl,
  image,
}: ProductOrderActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const quantityLine = quantity > 1 ? `\nQuantity: ${quantity}` : "";
  const message = `Hi, I want to order this product:\n\nProduct: ${name}\nPrice: ₹${price}${quantityLine}\nLink: ${productUrl}`;
  const whatsappLink = useMemo(() => buildWhatsAppLink(message), [message]);

  const updateQuantity = (next: number) => {
    setQuantity(Math.max(1, Math.min(next, 10)));
  };

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border border-[var(--pp-border)] bg-white px-4 py-2 text-sm shadow-sm">
          <span className="text-[var(--pp-muted)]">Qty</span>
          <div className="flex items-center gap-2">
            <button
              className="h-7 w-7 rounded-full border border-[var(--pp-border)] text-sm"
              onClick={() => updateQuantity(quantity - 1)}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="min-w-[16px] text-center font-medium">{quantity}</span>
            <button
              className="h-7 w-7 rounded-full border border-[var(--pp-border)] text-sm"
              onClick={() => updateQuantity(quantity + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
        <button
          className={`btn-outline text-sm transition-all ${added ? "cart-pop ring-2 ring-[var(--pp-gold)]/30" : ""}`}
          onClick={() => {
            setCartItemQuantity(
              {
                id,
                name,
                slug: productUrl.split("/").pop() ?? id,
                price,
                image,
              },
              quantity
            );
            trackEvent("add_to_cart", { product: name, quantity });
            setAdded(true);
            window.setTimeout(() => setAdded(false), 600);
          }}
        >
          {added ? "Added" : "Add to cart"}
        </button>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="btn-primary text-sm"
          onClick={() => trackEvent("whatsapp_click", { product: name })}
        >
          Order on WhatsApp
        </a>
      </div>
      <div className="grid gap-3 text-xs text-[var(--pp-muted)] sm:grid-cols-3">
        {["Secure packaging", "Fast delivery", "Affordable pricing"].map((item) => (
          <div
            key={item}
            className="rounded-full border border-[var(--pp-border)] bg-[var(--pp-beige)]/70 px-3 py-2 text-center"
          >
            {item}
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--pp-border)] bg-white/95 p-4 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{formatCurrency(price)}</span>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#1f7a4f] px-5 py-3 text-sm font-semibold text-white"
            onClick={() => trackEvent("whatsapp_click", { product: name, context: "sticky" })}
          >
            Order on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
