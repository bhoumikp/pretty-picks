"use client";

import Image from "next/image";
import { useMemo, useState, type TouchEvent } from "react";
import { normalizeImages } from "@/lib/images";

interface ProductGalleryProps {
  images: unknown;
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const normalized = useMemo(() => normalizeImages(images), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const active = normalized[activeIndex] ?? normalized[0];

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    setTouchStart(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStart === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStart;
    const delta = touchStart - endX;
    if (Math.abs(delta) > 40) {
      setActiveIndex((prev) => {
        if (delta > 0) {
          return Math.min(prev + 1, normalized.length - 1);
        }
        return Math.max(prev - 1, 0);
      });
    }
    setTouchStart(null);
  };

  if (!active) return null;

  return (
    <div className="space-y-4">
      <div
        className="group relative aspect-square overflow-hidden rounded-xl border border-[var(--pp-border)] bg-white shadow-sm"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={active.url}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </div>
      <div className="flex gap-3 overflow-x-auto md:grid md:grid-cols-4 md:overflow-visible">
        {normalized.slice(0, 6).map((image, index) => (
          <button
            key={`${image.url}-${index}`}
            onClick={() => setActiveIndex(index)}
            className={`relative aspect-square w-20 flex-none overflow-hidden rounded-xl border bg-[var(--pp-beige)] md:w-auto ${
              index === activeIndex ? "border-[var(--pp-gold)]" : "border-[var(--pp-border)]"
            }`}
          >
            <Image src={image.url} alt={name} fill className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
