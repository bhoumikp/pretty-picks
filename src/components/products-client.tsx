"use client";

import { useMemo, useState } from "react";
import ProductGrid from "@/components/product-grid";
import { trackEvent } from "@/lib/analytics";
import type { CategorySummary, ProductSummary } from "@/types/catalog";

interface ProductsClientProps {
  products: ProductSummary[];
  categories: CategorySummary[];
  initialQuery: string;
  initialCategory: string;
}

const MATERIALS = ["Alloy", "Enamel", "Faux Pearl", "Anti-tarnish"];

export default function ProductsClient({
  products,
  categories,
  initialQuery,
  initialCategory,
}: ProductsClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999]);
  const [material, setMaterial] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [visible, setVisible] = useState(8);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(query.toLowerCase());
      const categoryMatch = category ? product.category?.slug === category : true;
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
      const materialMatch = material
        ? String(product.material ?? "").toLowerCase().includes(material.toLowerCase())
        : true;
      const featuredMatch = featuredOnly ? Boolean(product.featured) : true;
      return nameMatch && categoryMatch && priceMatch && materialMatch && featuredMatch;
    });

    switch (sort) {
      case "price-low":
        return result.sort((a, b) => a.price - b.price);
      case "price-high":
        return result.sort((a, b) => b.price - a.price);
      case "popular":
        return result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      default:
        return result;
    }
  }, [products, query, category, priceRange, material, featuredOnly, sort]);

  const visibleItems = filtered.slice(0, visible);

  const categoryLabel = category
    ? categories.find((item) => item.slug === category)?.name ?? category
    : "";
  const activeFilters = [
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
  ].filter(Boolean) as { label: string; onRemove: () => void }[];

  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setMaterial("");
    setFeaturedOnly(false);
    setPriceRange([0, 999]);
    setSort("newest");
    setVisible(8);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="rounded-2xl border border-[var(--pp-border)] bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold">Filters</h3>
            <div className="mt-5 space-y-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                Category
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className={`rounded-full border px-3 py-1 ${
                    !category ? "border-[var(--pp-gold)] text-[var(--pp-gold)]" : "border-[var(--pp-border)]"
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
                    className={`rounded-full border px-3 py-1 ${
                      category === item.slug
                        ? "border-[var(--pp-gold)] text-[var(--pp-gold)]"
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
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                Price
              </p>
              <div className="mt-2 flex gap-2">
                {[199, 299, 499].map((value) => (
                  <button
                    key={value}
                    className={`rounded-full border px-3 py-1 ${
                      priceRange[1] === value
                        ? "border-[var(--pp-gold)] text-[var(--pp-gold)]"
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
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
                Material
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {MATERIALS.map((item) => (
                  <button
                    key={item}
                    className={`rounded-full border px-3 py-1 ${
                      material === item
                        ? "border-[var(--pp-gold)] text-[var(--pp-gold)]"
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
            <label className="flex items-center gap-2">
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
            <button className="text-xs font-semibold text-[var(--pp-gold)]" onClick={clearFilters}>
              Clear filters
            </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="space-y-7">
        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--pp-border)] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              className="w-full rounded-xl border border-[var(--pp-border)] px-3 py-2 text-sm sm:w-64"
            />
            <button
              className="rounded-xl border border-[var(--pp-border)] px-3 py-2 text-xs"
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
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="w-full rounded-xl border border-[var(--pp-border)] px-3 py-2 text-sm sm:w-auto"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="popular">Popular</option>
            </select>
          </div>
        </div>

        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-black/40"
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Filters</h3>
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
                      className={`rounded-full border px-3 py-1 ${
                        !category ? "border-[var(--pp-gold)] text-[var(--pp-gold)]" : "border-[var(--pp-border)]"
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
                        className={`rounded-full border px-3 py-1 ${
                          category === item.slug
                            ? "border-[var(--pp-gold)] text-[var(--pp-gold)]"
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
                        className={`rounded-full border px-3 py-1 ${
                          priceRange[1] === value
                            ? "border-[var(--pp-gold)] text-[var(--pp-gold)]"
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
                        className={`rounded-full border px-3 py-1 ${
                          material === item
                            ? "border-[var(--pp-gold)] text-[var(--pp-gold)]"
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
                <label className="flex items-center gap-2">
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
                    className="text-xs font-semibold text-[var(--pp-gold)]"
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
                className="flex items-center gap-2 rounded-full border border-[var(--pp-border)] bg-[var(--pp-beige)] px-3 py-1 text-xs"
              >
                {item.label}
                <span className="text-[10px]">×</span>
              </button>
            ))}
            <button className="text-xs font-semibold text-[var(--pp-gold)]" onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[var(--pp-border)] bg-white p-10 text-center text-sm text-[var(--pp-muted)]">
            No products found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <ProductGrid products={visibleItems} />
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
