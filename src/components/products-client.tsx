"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductGrid from "@/components/product-grid";
import { SkeletonGrid } from "@/components/skeletons";
import { trackEvent } from "@/lib/analytics";
import type { CategorySummary, ProductSummary } from "@/types/catalog";

interface ProductsClientProps {
  initialProducts: ProductSummary[];
  initialTotal: number;
  categories: CategorySummary[];
  initialQuery: string;
  initialCategory: string;
  initialPriceCap?: number;
}

const MATERIALS = ["Alloy", "Enamel", "Faux Pearl", "Anti-tarnish"];
const PAGE_SIZE = 12;

export default function ProductsClient({
  initialProducts,
  initialTotal,
  categories,
  initialQuery,
  initialCategory,
  initialPriceCap,
}: ProductsClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState<[number, number]>(() =>
    typeof initialPriceCap === "number" && !Number.isNaN(initialPriceCap)
      ? [0, initialPriceCap]
      : [0, 999]
  );
  const [material, setMaterial] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [items, setItems] = useState<ProductSummary[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(
    initialProducts.length === 0 && initialTotal > 0
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initialFetchSkipped = useRef(false);
  const hasItemsRef = useRef(initialProducts.length > 0);
  const initialKeyRef = useRef(
    JSON.stringify({
      q: initialQuery.trim(),
      category: initialCategory,
      material: "",
      featured: false,
      min: 0,
      max:
        typeof initialPriceCap === "number" && !Number.isNaN(initialPriceCap)
          ? initialPriceCap
          : 999,
      sort: "newest",
    })
  );
  const lastAppliedKeyRef = useRef<string | null>(
    initialProducts.length > 0 ? initialKeyRef.current : null
  );
  const showInitialSkeleton = loading && items.length === 0;

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price-low", label: "Price: low to high" },
    { value: "price-high", label: "Price: high to low" },
    { value: "popular", label: "Popular" },
  ];

  const categoryLabel = category
    ? categories.find((item) => item.slug === category)?.name ?? category
    : "";
  const activeFilters = useMemo(
    () =>
      [
        query
          ? { label: `Search: ${query}`, onRemove: () => setQuery("") }
          : null,
        category
          ? { label: `Category: ${categoryLabel}`, onRemove: () => setCategory("") }
          : null,
        material
          ? { label: `Material: ${material}`, onRemove: () => setMaterial("") }
          : null,
        featuredOnly
          ? { label: "Featured", onRemove: () => setFeaturedOnly(false) }
          : null,
        priceRange[1] < 999
          ? { label: `Under ₹${priceRange[1]}`, onRemove: () => setPriceRange([0, 999]) }
          : null,
      ].filter(Boolean) as { label: string; onRemove: () => void }[],
    [query, category, categoryLabel, material, featuredOnly, priceRange]
  );

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setMaterial("");
    setFeaturedOnly(false);
    setPriceRange([0, 999]);
    setSort("newest");
  };

  const fetchProducts = useCallback(
    async ({ append = false, skip = 0 }: { append?: boolean; skip?: number } = {}) => {
      const requestKey = JSON.stringify({
        q: debouncedQuery,
        category,
        material,
        featured: featuredOnly,
        min: priceRange[0],
        max: priceRange[1],
        sort,
      });
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
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (category) params.set("category", category);
        if (material) params.set("material", material);
        if (featuredOnly) params.set("featured", "true");
        if (priceRange[0] > 0) params.set("minPrice", String(priceRange[0]));
        if (priceRange[1] < 999) params.set("maxPrice", String(priceRange[1]));
        if (sort) params.set("sort", sort);
        params.set("take", String(PAGE_SIZE));
        params.set("skip", String(skip));

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
    [debouncedQuery, category, material, featuredOnly, priceRange, sort]
  );

  useEffect(() => {
    hasItemsRef.current = items.length > 0;
  }, [items.length]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const initialKey = JSON.stringify({
      q: initialQuery.trim(),
      category: initialCategory,
      material: "",
      featured: false,
      min: 0,
      max: 999,
      sort: "newest",
    });
    const currentKey = JSON.stringify({
      q: debouncedQuery,
      category,
      material,
      featured: featuredOnly,
      min: priceRange[0],
      max: priceRange[1],
      sort,
    });

    if (!initialFetchSkipped.current) {
      initialFetchSkipped.current = true;
      if ((initialProducts.length > 0 || initialTotal === 0) && initialKey === currentKey) {
        return;
      }
    }

    fetchProducts({ append: false, skip: 0 });
  }, [
    fetchProducts,
    initialCategory,
    initialQuery,
    initialProducts.length,
    initialTotal,
    debouncedQuery,
    category,
    material,
    featuredOnly,
    priceRange,
    sort,
  ]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!sortRef.current) return;
      if (!sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="grid gap-12 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-36">
          {showInitialSkeleton ? (
            <div className="rounded-3xl border border-[var(--pp-border)] bg-white p-6 shadow-sm">
              <div className="h-4 w-24 rounded-full bg-[var(--pp-beige)]" />
              <div className="mt-6 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index}>
                    <div className="h-3 w-20 rounded-full bg-[var(--pp-beige)]" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Array.from({ length: 4 }).map((__, chipIndex) => (
                        <div
                          key={chipIndex}
                          className="h-7 w-16 rounded-full bg-[var(--pp-beige)]"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-[var(--pp-border)] p-6 bg-white shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">
                Filters
              </h3>
              <div className="mt-5 divide text-sm">
              <div className="">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                  Category
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className={`cursor-pointer rounded-lg border px-3 py-1 shadow-xs ${
                      !category
                        ? "border-[var(--pp-ink)] bg-[var(--pp-beige)]/70 text-[var(--pp-ink)]"
                        : "border-[var(--pp-border)]"
                    }`}
                    onClick={() => {
                      setCategory("");
                      trackEvent("filter_used", { type: "category", value: "all" });
                    }}
                  >
                    All
                  </button>
                  {categories.map((item) => (
                    <button
                      key={item.id}
                      className={`cursor-pointer rounded-md border px-3 py-1 shadow-sm ${
                        category === item.slug
                          ? "border-[var(--pp-ink)] bg-[var(--pp-beige)]/70 text-[var(--pp-ink)]"
                          : "border-[var(--pp-border)]"
                      }`}
                      onClick={() => {
                        setCategory(item.slug);
                        trackEvent("filter_used", { type: "category", value: item.slug });
                      }}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                  Price
                </p>
                <div className="mt-2 flex gap-2">
                  {[199, 299, 499].map((value) => (
                    <button
                      key={value}
                      className={`cursor-pointer rounded-xl border px-3 py-1 shadow-sm ${
                        priceRange[1] === value
                          ? "border-[var(--pp-ink)] bg-[var(--pp-beige)]/70 text-[var(--pp-ink)]"
                          : "border-[var(--pp-border)]"
                      }`}
                      onClick={() => {
                        setPriceRange([0, value]);
                        trackEvent("filter_used", { type: "price", value });
                      }}
                    >
                      Under ₹{value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                  Material
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MATERIALS.map((item) => (
                    <button
                      key={item}
                      className={`cursor-pointer rounded-md border px-3 py-1 shadow-sm ${
                        material === item
                          ? "border-[var(--pp-ink)] bg-[var(--pp-beige)]/70 text-[var(--pp-ink)]"
                          : "border-[var(--pp-border)]"
                      }`}
                      onClick={() => {
                        setMaterial(item);
                        trackEvent("filter_used", { type: "material", value: item });
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(event) => {
                    setFeaturedOnly(event.target.checked);
                    trackEvent("filter_used", { type: "featured", value: event.target.checked });
                  }}
                />
                Featured only
              </label>
              <button className="cursor-pointer pt-5 text-xs font-semibold text-[var(--pp-ink)] underline underline-offset-4" onClick={clearFilters}>
                Clear filters
              </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="space-y-7">
        {showInitialSkeleton ? (
          <div className="flex flex-col gap-4 border-b border-[var(--pp-border)] pb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="h-10 w-full rounded-full bg-[var(--pp-beige)] sm:w-64" />
              <div className="h-9 w-24 rounded-full bg-[var(--pp-beige)]" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="h-4 w-32 rounded-full bg-[var(--pp-beige)]" />
              <div className="h-10 w-full rounded-full bg-[var(--pp-beige)] sm:w-52" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 border-b border-[var(--pp-border)] pb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                className="w-full rounded-full border border-[var(--pp-border)] bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/40 sm:w-64"
              />
              <button
                className="cursor-pointer rounded-full border border-[var(--pp-border)] px-4 py-2 text-xs"
                onClick={() => setFiltersOpen((prev) => !prev)}
              >
                Filters
              </button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <p className="text-xs text-[var(--pp-muted)]">
                Showing <span className="font-semibold text-[var(--pp-ink)]">{items.length}</span> of{" "}
                {total}
              </p>
              <div className="relative w-full sm:w-auto" ref={sortRef}>
                <button
                  className="flex w-full items-center justify-between gap-2 rounded-full border border-[var(--pp-border)] bg-white px-4 py-2 text-sm shadow-sm sm:min-w-[220px]"
                  onClick={() => setSortOpen((prev) => !prev)}
                  type="button"
                >
                  <span>{sortOptions.find((opt) => opt.value === sort)?.label ?? "Sort"}</span>
                  <span className="text-[10px]">▾</span>
                </button>
                {sortOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-[var(--pp-border)] bg-white p-2 shadow-lg">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                          sort === option.value
                            ? "bg-[var(--pp-beige)]/70 font-semibold"
                            : "hover:bg-[var(--pp-beige)]/40"
                        }`}
                        onClick={() => {
                          setSort(option.value);
                          setSortOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-black/40"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
            />
            {showInitialSkeleton ? (
              <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 rounded-full bg-[var(--pp-beige)]" />
                  <div className="h-3 w-12 rounded-full bg-[var(--pp-beige)]" />
                </div>
                <div className="mt-4 grid gap-4 text-sm">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index}>
                      <div className="h-3 w-20 rounded-full bg-[var(--pp-beige)]" />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Array.from({ length: 4 }).map((__, chipIndex) => (
                          <div
                            key={chipIndex}
                            className="h-7 w-16 rounded-full bg-[var(--pp-beige)]"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="h-7 w-28 rounded-full bg-[var(--pp-beige)]" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 rounded-full bg-[var(--pp-beige)]" />
                    <div className="h-9 w-28 rounded-full bg-[var(--pp-beige)]" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--pp-muted)]">Filters</h3>
                  <button
                    className="text-xs text-[var(--pp-muted)]"
                    onClick={() => setFiltersOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="mt-4 grid gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                      Category
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        className={`cursor-pointer rounded-full border px-3 py-1 ${
                          !category
                            ? "border-[var(--pp-ink)] bg-[var(--pp-beige)]/70 text-[var(--pp-ink)]"
                            : "border-[var(--pp-border)]"
                        }`}
                        onClick={() => {
                          setCategory("");
                          trackEvent("filter_used", { type: "category", value: "all" });
                        }}
                      >
                        All
                      </button>
                      {categories.map((item) => (
                        <button
                          key={item.id}
                          className={`cursor-pointer rounded-full border px-3 py-1 ${
                            category === item.slug
                              ? "border-[var(--pp-ink)] bg-[var(--pp-beige)]/70 text-[var(--pp-ink)]"
                              : "border-[var(--pp-border)]"
                          }`}
                          onClick={() => {
                            setCategory(item.slug);
                            trackEvent("filter_used", { type: "category", value: item.slug });
                          }}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Price</p>
                    <div className="mt-2 flex gap-2">
                      {[199, 299, 499].map((value) => (
                        <button
                          key={value}
                          className={`cursor-pointer rounded-full border px-3 py-1 ${
                            priceRange[1] === value
                              ? "border-[var(--pp-ink)] bg-[var(--pp-beige)]/70 text-[var(--pp-ink)]"
                              : "border-[var(--pp-border)]"
                          }`}
                          onClick={() => {
                            setPriceRange([0, value]);
                            trackEvent("filter_used", { type: "price", value });
                          }}
                        >
                          Under ₹{value}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Material</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {MATERIALS.map((item) => (
                        <button
                          key={item}
                          className={`cursor-pointer rounded-full border px-3 py-1 ${
                            material === item
                              ? "border-[var(--pp-ink)] bg-[var(--pp-beige)]/70 text-[var(--pp-ink)]"
                              : "border-[var(--pp-border)]"
                          }`}
                          onClick={() => {
                            setMaterial(item);
                            trackEvent("filter_used", { type: "material", value: item });
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={featuredOnly}
                      onChange={(event) => {
                        setFeaturedOnly(event.target.checked);
                        trackEvent("filter_used", { type: "featured", value: event.target.checked });
                      }}
                    />
                    Featured only
                  </label>
                  <div className="flex items-center justify-between">
                    <button
                      className="cursor-pointer text-xs font-semibold text-[var(--pp-ink)] underline underline-offset-4"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </button>
                    <button
                      className="btn-primary text-xs"
                      onClick={() => setFiltersOpen(false)}
                    >
                      Apply filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((item) => (
              <button
                key={item.label}
                onClick={item.onRemove}
                className="flex items-center gap-2 rounded-full border border-[var(--pp-border)] bg-[var(--pp-beige)]/70 px-3 py-1 text-xs"
              >
                {item.label}
                <span className="text-[10px]">×</span>
              </button>
            ))}
            <button className="text-xs font-semibold text-[var(--pp-ink)] underline underline-offset-4" onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

        {loading && items.length === 0 ? (
          <SkeletonGrid count={8} />
        ) : error ? (
          <div className="rounded-3xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
            No products found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <ProductGrid products={items} />
            {loadingMore && <SkeletonGrid count={4} className="mt-6" />}
            {items.length < total && !loadingMore && (
              <div className="flex justify-center">
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
    </div>
  );
}
