"use client";

import { useRef } from "react";
import ProductCard from "@/components/product-card";
import type { ProductSummary } from "@/types/catalog";

interface FeaturedCarouselProps {
  products: ProductSummary[];
}

export default function FeaturedCarousel({ products }: FeaturedCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByViewport = (direction: "prev" | "next") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const firstCard = scroller.firstElementChild as HTMLElement | null;
    const styles = window.getComputedStyle(scroller);
    const gapValue = styles.columnGap || styles.gap || "0";
    const gap = Number.parseFloat(gapValue) || 0;
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : scroller.clientWidth;
    const distance = cardWidth + gap;
    const nextLeft = scroller.scrollLeft + (direction === "next" ? distance : -distance);

    try {
      scroller.scrollTo({ left: nextLeft, behavior: "smooth" });
    } catch {
      scroller.scrollLeft = nextLeft;
    }
  };

  return (
    <div className="relative overflow-visible">
      <div
        ref={scrollerRef}
        className="featured-carousel relative z-0 flex w-full max-w-full flex-nowrap snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 scroll-smooth"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variant="carousel" />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-between px-2">
        <button
          type="button"
          aria-label="Scroll featured products left"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pp-border)] bg-white/90 shadow-sm backdrop-blur transition hover:bg-white md:h-11 md:w-11"
          style={{ touchAction: "manipulation" }}
          onClick={() => scrollByViewport("prev")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 6L9 12L15 18" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Scroll featured products right"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pp-border)] bg-white/90 shadow-sm backdrop-blur transition hover:bg-white md:h-11 md:w-11"
          style={{ touchAction: "manipulation" }}
          onClick={() => scrollByViewport("next")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 6L15 12L9 18" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
