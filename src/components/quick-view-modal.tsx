"use client";

import Image from "next/image";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { primaryImage } from "@/lib/images";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/data/site";
import type { ProductSummary } from "@/types/catalog";

interface QuickViewModalProps {
  product: ProductSummary;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const productUrl = `https://${siteConfig.domain}/products/${product.slug}`;
  const message = `Hi, I want to order this product:\n\nProduct: ${product.name}\nPrice: ₹${product.price}\nQuantity: 1\nLink: ${productUrl}`;
  const whatsappLink = buildWhatsAppLink(message);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl sm:max-h-[85vh] sm:overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <button onClick={onClose} className="text-sm text-[var(--pp-muted)]">
            Close
          </button>
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--pp-border)] bg-[var(--pp-beige)]">
            <Image src={primaryImage(product.images)} alt={product.name} fill className="object-cover" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-wide text-[var(--pp-ink)]">
              {formatCurrency(product.price)}
            </p>
            <p className="mt-3 text-sm text-[var(--pp-muted)]">
              {product.description ?? "A premium pick curated for everyday elegance."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#1f7a4f] px-5 py-2 text-sm font-semibold text-white"
              >
                Order on WhatsApp
              </a>
              <a href={`/products/${product.slug}`} className="btn-outline text-sm">
                View details
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
