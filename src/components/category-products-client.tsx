"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProductGrid from "@/components/product-grid";
import { SkeletonGrid } from "@/components/skeletons";
import { trackEvent } from "@/lib/analytics";
import type { ProductSummary } from "@/types/catalog";

interface CategoryProductsClientProps {
  initialProducts: ProductSummary[];
  initialTotal: number;
  categorySlug: string;
}

const PAGE_SIZE = 12;

export default function CategoryProductsClient({
  initialProducts,
  initialTotal,
  categorySlug,
}: CategoryProductsClientProps) {
  const [items, setItems] = useState<ProductSummary[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(
    initialProducts.length === 0 && initialTotal > 0
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialFetchSkipped = useRef(false);
  const hasItemsRef = useRef(initialProducts.length > 0);
  const initialKeyRef = useRef(categorySlug);
  const lastAppliedKeyRef = useRef<string | null>(
    initialProducts.length > 0 ? initialKeyRef.current : null
  );

  const fetchProducts = useCallback(
    async ({ append = false, skip = 0 }: { append?: boolean; skip?: number } = {}) => {
      const requestKey = categorySlug;
      if (!append && lastAppliedKeyRef.current === requestKey && hasItemsRef.current) {
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      if (!append) {
        const shouldShowSkeleton = !hasItemsRef.current;
        setLoading(shouldShowSkeleton);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams();
        params.set("category", categorySlug);
        params.set("take", String(PAGE_SIZE));
        params.set("skip", String(skip));
        params.set("sort", "newest");

        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load products");
        }
        const data = (await response.json()) as { items?: ProductSummary[]; total?: number };
        if (!Array.isArray(data.items)) {
          throw new Error("Invalid product response");
        }
        const nextTotal = typeof data.total === "number" ? data.total : data.items.length;
        setTotal(nextTotal);
        setItems((prev) => {
          const nextItems = append ? [...prev, ...data.items] : data.items;
          hasItemsRef.current = nextItems.length > 0;
          lastAppliedKeyRef.current = requestKey;
          return nextItems;
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError("Could not load products. Please try again.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categorySlug]
  );

  useEffect(() => {
    hasItemsRef.current = items.length > 0;
  }, [items.length]);

  useEffect(() => {
    if (!initialFetchSkipped.current) {
      initialFetchSkipped.current = true;
      if (initialProducts.length > 0 || initialTotal === 0) {
        return;
      }
    }
    fetchProducts({ append: false, skip: 0 });
  }, [fetchProducts, initialProducts.length, initialTotal]);

  return (
    <div className="mt-8">
      {loading && items.length === 0 ? (
        <SkeletonGrid count={8} />
      ) : error ? (
        <div className="rounded-3xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
          No products found in this category yet. Check back soon.
        </div>
      ) : (
        <>
          <ProductGrid products={items} />
          {loadingMore && <SkeletonGrid count={4} className="mt-6" />}
          {items.length < total && !loadingMore && (
            <div className="mt-6 flex justify-center">
              <button
                className="btn-outline text-sm"
                onClick={() => {
                  fetchProducts({ append: true, skip: items.length });
                  trackEvent("load_more_products", { visible: items.length + PAGE_SIZE });
                }}
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
