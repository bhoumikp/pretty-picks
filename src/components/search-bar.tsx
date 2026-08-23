"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
	mode?: "popover" | "panel";
	onResultSelect?: () => void;
	inputClassName?: string;
	resultsClassName?: string;
	hideResults?: boolean;
	onResults?: (results: SearchResult[], query: string, loading: boolean) => void;
}

export default function SearchBar({
	className,
	mode = "popover",
	onResultSelect,
	inputClassName,
	resultsClassName,
	hideResults = false,
	onResults,
}: SearchBarProps) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [allProducts, setAllProducts] = useState<SearchResult[] | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	const closePopover = useCallback(() => setOpen(false), []);

	useEffect(() => {
		if (!open) return;
		const handler = (event: MouseEvent) => {
			if (!containerRef.current) return;
			if (!containerRef.current.contains(event.target as Node)) {
				closePopover();
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [open, closePopover]);

	const hasResults = useMemo(() => results.length > 0, [results]);

	const filterResults = (items: SearchResult[], term: string) => {
		const needle = term.toLowerCase();
		const filtered = items.filter((product) => {
			const nameMatch = product.name.toLowerCase().includes(needle);
			const categoryMatch = product.category?.name.toLowerCase().includes(needle);
			return nameMatch || Boolean(categoryMatch);
		});
		setResults(filtered.slice(0, 6));
		onResults?.(filtered.slice(0, 6), term, false);
	};

	const fetchProducts = async () => {
		if (allProducts) return allProducts;
		setLoading(true);
		onResults?.(results, query, true);
		try {
			const response = await fetch("/api/products");
			if (!response.ok) return [];
			const data = (await response.json()) as SearchResult[];
			setAllProducts(data);
			return data;
		} finally {
			setLoading(false);
			onResults?.(results, query, false);
		}
	};

	return (
		<div ref={containerRef} className={`relative ${mode === "panel" ? "flex flex-col" : ""} ${className ?? ""}`}>
			<input
				value={query}
				suppressHydrationWarning
				onChange={(event) => {
					const next = event.target.value;
					setQuery(next);
					setOpen(true);
					onResults?.([], next, Boolean(next.trim()));
					if (debounceRef.current) {
						clearTimeout(debounceRef.current);
					}
					if (!next.trim()) {
						setResults([]);
						setLoading(false);
						onResults?.([], "", false);
						return;
					}
					debounceRef.current = setTimeout(async () => {
						const items = allProducts ?? (await fetchProducts());
						filterResults(items, next);
					}, 250);
				}}
				onFocus={() => setOpen(true)}
				onKeyDown={(event) => {
					if (event.key === "Enter" && query.trim()) {
						router.push(`/products?q=${encodeURIComponent(query)}`);
						onResultSelect?.();
					}
				}}
				placeholder="Search jewelry"
				autoComplete="off"
				autoCapitalize="off"
				autoCorrect="off"
				spellCheck={false}
				inputMode="search"
				className={`w-full bg-transparent px-2 py-2 text-base focus:outline-none ${
					inputClassName ?? "rounded-full border border-[var(--pp-border)] bg-white/90 px-4 text-sm shadow-sm focus:ring-2 focus:ring-[var(--pp-gold)]/40"
				}`}
			/>
			{!hideResults && open && query.trim() && (
				<div
					className={`${
						mode === "panel"
							? "mt-4 max-h-[60vh] overflow-auto rounded-2xl border border-[var(--pp-border)] bg-white p-3 shadow-xl"
							: "absolute left-0 right-0 top-12 z-50 max-h-72 overflow-auto rounded-2xl border border-[var(--pp-border)] bg-white p-3 shadow-xl"
					} ${resultsClassName ?? ""}`}
				>
					{loading ? (
						<p className="text-sm text-[var(--pp-muted)]">Searching…</p>
					) : hasResults ? (
						<div className="space-y-3">
							{results.map((product) => (
								<Link
									key={product.id}
									href={`/products/${product.slug}`}
									className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[var(--pp-beige)]"
									onClick={() => {
										trackEvent("search_suggestion_click", { id: product.id });
										onResultSelect?.();
									}}
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
								onClick={() => onResultSelect?.()}
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
