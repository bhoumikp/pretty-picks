"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  pageSize: number
) => {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (sort.length) params.set("sort", sort.join(","));
  if (dir.length) params.set("dir", dir.join(","));
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
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
  const [loading, setLoading] = useState(false);
  const userTypedRef = useRef(false);

  const syncUrl = (nextQuery: string, nextPage: number, nextSort: string[], nextDir: Array<"asc" | "desc">) => {
    if (typeof window === "undefined") return;
    const params = buildQueryString(nextQuery, nextPage, nextSort, nextDir, pageSize);
    const url = `/admin/products?${params}`;
    window.history.replaceState(null, "", url);
  };

  const fetchProducts = async (
    nextQuery: string,
    nextPage: number,
    nextSort: string[],
    nextDir: Array<"asc" | "desc">
  ) => {
    setLoading(true);
    const params = buildQueryString(nextQuery, nextPage, nextSort, nextDir, pageSize);
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
  };

  useEffect(() => {
    if (!userTypedRef.current) return;
    const handle = window.setTimeout(() => {
      const nextPage = 1;
      fetchProducts(query, nextPage, sort, dir);
      setPage(nextPage);
      syncUrl(query, nextPage, sort, dir);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const handlePageChange = (nextPage: number) => {
    fetchProducts(query, nextPage, sort, dir);
    setPage(nextPage);
    syncUrl(query, nextPage, sort, dir);
  };

  const handleSort = (key: string, shiftKey: boolean) => {
    const existingIndex = sort.indexOf(key);
    let nextSort = [...sort];
    let nextDir = [...dir];
    const nextDirection = existingIndex >= 0 && nextDir[existingIndex] === "asc" ? "desc" : "asc";

    if (shiftKey) {
      if (existingIndex >= 0) {
        nextDir[existingIndex] = nextDirection;
      } else {
        nextSort.push(key);
        nextDir.push("asc");
      }
    } else {
      nextSort = [key];
      nextDir = [nextDirection];
    }

    const nextPage = 1;
    setSort(nextSort);
    setDir(nextDir);
    setPage(nextPage);
    fetchProducts(query, nextPage, nextSort, nextDir);
    syncUrl(query, nextPage, nextSort, nextDir);
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

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
              className="w-full rounded-lg border border-[var(--pp-border)] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30"
            />
          </div>
          <Link href="/admin/products/new" className="btn-primary admin-btn text-xs px-4 py-2">
            <span className="admin-btn-label">Add product</span>
          </Link>
        </div>
      </div>
      <AdminProductsTable
        products={products}
        page={page}
        pageSize={pageSize}
        total={total}
        sort={sort}
        dir={dir}
        onSort={handleSort}
        onPageChange={handlePageChange}
        isLoading={loading}
      />
      <p className="text-xs text-[var(--pp-muted)]">Page {page} of {totalPages}</p>
    </div>
  );
}
