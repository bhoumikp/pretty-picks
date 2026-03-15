"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductGrid from "@/components/product-grid";
import ProductCard from "@/components/product-card";
import { trackEvent } from "@/lib/analytics";
import type { CategorySummary, ProductSummary } from "@/types/catalog";

interface ProductsClientProps {
  products: ProductSummary[];
  categories: CategorySummary[];
  initialQuery: string;
  initialCategory: string;
  initialPriceCap?: number;
  initialSort?: string;
}

const MATERIALS = ["Alloy", "Enamel", "Faux Pearl", "Anti-tarnish"];

export default function ProductsClient({
  products,
  categories,
  initialQuery,
  initialCategory,
  initialPriceCap,
  initialSort = "newest",
}: ProductsClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState<[number, number]>(() =>
    typeof initialPriceCap === "number" && !Number.isNaN(initialPriceCap)
      ? [0, initialPriceCap]
      : [0, 999]
  );
  const [material, setMaterial] = useState("");
  const [sort, setSort] = useState(initialSort);
  const [visible, setVisible] = useState(8);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price-low", label: "Price: low to high" },
    { value: "price-high", label: "Price: high to low" },
    { value: "popular", label: "Most loved" },
  ];

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(query.toLowerCase());
      const categoryMatch = category ? product.category?.slug === category : true;
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
      const materialMatch = material
        ? String(product.material ?? "").toLowerCase().includes(material.toLowerCase())
        : true;
      return nameMatch && categoryMatch && priceMatch && materialMatch;
    });

    switch (sort) {
      case "price-low":
        return result.sort((a, b) => a.price - b.price);
      case "price-high":
        return result.sort((a, b) => b.price - a.price);
      case "popular":
        return result.sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0));
      default:
        return result;
    }
  }, [products, query, category, priceRange, material, sort]);

  const visibleItems = filtered.slice(0, visible);

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
        priceRange[1] < 999
          ? { label: `Under ₹${priceRange[1]}`, onRemove: () => setPriceRange([0, 999]) }
          : null,
      ].filter(Boolean) as { label: string; onRemove: () => void }[],
    [query, category, categoryLabel, material, priceRange]
  );

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setMaterial("");
    setPriceRange([0, 999]);
    setSort("newest");
    setVisible(8);
  };

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
                    className={`cursor-pointer rounded-full border px-3 py-1 shadow-xs ${
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
                      className={`cursor-pointer rounded-full border px-3 py-1 shadow-sm ${
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
                      className={`cursor-pointer rounded-full border px-3 py-1 shadow-sm ${
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
                      className={`cursor-pointer rounded-full border px-3 py-1 shadow-sm ${
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
              <button className="cursor-pointer pt-5 text-xs font-semibold text-[var(--pp-ink)] underline underline-offset-4" onClick={clearFilters}>
                Clear filters
              </button>
              </div>
            </div>
        </div>
      </aside>

      <div className="space-y-7">
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
                Showing <span className="font-semibold text-[var(--pp-ink)]">{filtered.length}</span> of{" "}
                {products.length}
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

        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-black/40"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
            />
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

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
            No products found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {visibleItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="hidden md:block">
              <ProductGrid products={visibleItems} />
            </div>
            {visible < filtered.length && (
              <div className="flex justify-center">
                <button
                  className="btn-outline text-sm"
                  onClick={() => {
                    setVisible((prev) => prev + 8);
                    trackEvent("load_more_products", { visible: visible + 8 });
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
