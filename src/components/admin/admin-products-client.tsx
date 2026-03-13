"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AdminProductsTable from "@/components/admin/admin-products-table";
import type { ProductImage } from "@/types/catalog";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  stock: number;
  categoryName?: string | null;
  image?: ProductImage | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminProductsClientProps {
  initialProducts: ProductRow[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  initialQuery: string;
  initialSort: string[];
  initialDir: Array<"asc" | "desc">;
}

const buildQueryString = (
  query: string,
  page: number,
  sort: string[],
  dir: Array<"asc" | "desc">,
  pageSize: number,
  defaults: { sort: string; dir: "asc" | "desc"; pageSize: number }
) => {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (sort[0] && sort[0] !== defaults.sort) params.set("sort", sort[0]);
  if (dir[0] && dir[0] !== defaults.dir) params.set("dir", dir[0]);
  if (page > 1) params.set("page", String(page));
  if (pageSize !== defaults.pageSize) params.set("pageSize", String(pageSize));
  return params.toString();
};

export default function AdminProductsClient({
  initialProducts,
  initialTotal,
  initialPage,
  pageSize,
  initialQuery,
  initialSort,
  initialDir,
}: AdminProductsClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);
  const [dir, setDir] = useState<Array<"asc" | "desc">>(initialDir);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const userTypedRef = useRef(false);
  const defaults = useMemo(
    () => ({
      sort: initialSort[0] ?? "updatedAt",
      dir: (initialDir[0] ?? "desc") as "asc" | "desc",
      pageSize,
    }),
    [initialSort, initialDir, pageSize]
  );

  const syncUrl = useCallback(
    (
      nextQuery: string,
      nextPage: number,
      nextSort: string[],
      nextDir: Array<"asc" | "desc">,
      nextPageSize: number
    ) => {
      if (typeof window === "undefined") return;
      const params = buildQueryString(nextQuery, nextPage, nextSort, nextDir, nextPageSize, defaults);
      const url = params ? `/admin/products?${params}` : "/admin/products";
      window.history.replaceState(null, "", url);
    },
    [defaults]
  );

  const fetchProducts = useCallback(
    async (
      nextQuery: string,
      nextPage: number,
      nextSort: string[],
      nextDir: Array<"asc" | "desc">
    ) => {
      setLoading(true);
      const params = buildQueryString(nextQuery, nextPage, nextSort, nextDir, rowsPerPage, defaults);
      const response = await fetch(`/api/admin/products?${params}`, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { items: ProductRow[]; total: number };
        setProducts(data.items);
        setTotal(data.total);
      } else {
        setProducts([]);
        setTotal(0);
      }
      setLoading(false);
    },
    [defaults, rowsPerPage]
  );

  useEffect(() => {
    if (!userTypedRef.current) return;
    const handle = window.setTimeout(() => {
      const nextPage = 1;
      fetchProducts(query, nextPage, sort, dir);
      setPage(nextPage);
      syncUrl(query, nextPage, sort, dir, rowsPerPage);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, rowsPerPage, sort, dir, fetchProducts, syncUrl]);

  const handlePageChange = (nextPage: number) => {
    fetchProducts(query, nextPage, sort, dir);
    setPage(nextPage);
    syncUrl(query, nextPage, sort, dir, rowsPerPage);
  };

  const handleSort = (key: string) => {
    const existingIndex = sort.indexOf(key);
    const currentDir = existingIndex >= 0 ? dir[existingIndex] : "desc";
    const nextDirection = currentDir === "asc" ? "desc" : "asc";
    const nextSort = [key];
    const nextDir: Array<"asc" | "desc"> = [nextDirection];

    const nextPage = 1;
    setSort(nextSort);
    setDir(nextDir);
    setPage(nextPage);
    fetchProducts(query, nextPage, nextSort, nextDir);
    syncUrl(query, nextPage, nextSort, nextDir, rowsPerPage);
  };

  const handleRowsChange = (nextRows: number) => {
    const nextPage = 1;
    setRowsPerPage(nextRows);
    setPage(nextPage);
    fetchProducts(query, nextPage, sort, dir);
    syncUrl(query, nextPage, sort, dir, nextRows);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">Catalog</p>
          <h2 className="text-2xl font-[var(--font-heading)]">Products</h2>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="flex w-full max-w-xs items-center gap-2">
            <input
              value={query}
              onChange={(event) => {
                userTypedRef.current = true;
                setQuery(event.target.value);
              }}
              placeholder="Search products"
              className="h-10 w-full border border-[var(--pp-border)] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30"
            />
          </div>
          <Link href="/admin/products/new" className="btn-primary admin-btn admin-btn-size">
            <span className="admin-btn-label">Add product</span>
          </Link>
        </div>
      </div>
      <AdminProductsTable
        products={products}
        page={page}
        pageSize={rowsPerPage}
        total={total}
        sort={sort}
        dir={dir}
        onSort={handleSort}
        onPageChange={handlePageChange}
        isLoading={loading}
        footerSlot={
          <div className="flex items-center gap-2 text-xs text-[var(--pp-muted)]">
            <span className="h-5 w-[2px] bg-[var(--pp-ink)]/20" />
            Rows
            <select
              className="admin-select border border-[var(--pp-border)] bg-white px-3 py-1 text-xs"
              value={rowsPerPage}
              onChange={(event) => handleRowsChange(Number(event.target.value))}
            >
              {[10, 15, 25, 50].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        }
      />
    </div>
  );
}
