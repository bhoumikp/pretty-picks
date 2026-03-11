"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { primaryImage } from "@/lib/images";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: unknown;
  category?: { name: string; slug: string } | null;
}

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasResults = useMemo(() => results.length > 0, [results]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setOpen(true);
          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }
          if (!next.trim()) {
            setResults([]);
            return;
          }
          debounceRef.current = setTimeout(async () => {
            const response = await fetch(
              `/api/products?q=${encodeURIComponent(next)}&take=6&skip=0`
            );
            if (!response.ok) return;
            const data = (await response.json()) as { items?: SearchResult[] };
            setResults(data.items ?? []);
          }, 250);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search jewelry"
        className="w-full rounded-full border border-[var(--pp-border)] bg-white/90 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/40"
      />
      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-72 overflow-auto rounded-2xl border border-[var(--pp-border)] bg-white p-3 shadow-xl">
          {hasResults ? (
            <div className="space-y-3">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[var(--pp-beige)]"
                  onClick={() => trackEvent("search_suggestion_click", { id: product.id })}
                >
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-[var(--pp-beige)]">
                    <Image
                      src={primaryImage(product.images)}
                      alt={product.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-[var(--pp-muted)]">
                      {product.category?.name ?? "Pretty Picks"}
                    </p>
                  </div>
                </Link>
              ))}
                <Link
                  href={`/products?q=${encodeURIComponent(query)}`}
                  className="block rounded-xl border border-[var(--pp-border)] px-3 py-2 text-center text-xs"
                >
                  View all results
                </Link>
            </div>
          ) : (
            <p className="text-sm text-[var(--pp-muted)]">No results found.</p>
          )}
        </div>
      )}
    </div>
  );
}
