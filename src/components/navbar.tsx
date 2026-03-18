"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { navigation, siteConfig } from "@/data/site";
import SearchBar from "@/components/search-bar";
import Image from "next/image";
import { primaryImage } from "@/lib/images";
import { getCart } from "@/lib/cart";

const subscribe = (callback: () => void) => {
	if (typeof window === "undefined") return () => undefined;
	const handler = () => callback();
	window.addEventListener("pp-cart-updated", handler);
	window.addEventListener("storage", handler);
	return () => {
		window.removeEventListener("pp-cart-updated", handler);
		window.removeEventListener("storage", handler);
	};
};
const getSnapshot = () =>
	getCart().reduce((sum, item) => sum + item.quantity, 0);

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchResults, setSearchResults] = useState<
		{ id: string; name: string; slug: string; price: number; images: unknown; category?: { name: string; slug: string } | null }[]
	>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchLoading, setSearchLoading] = useState(false);
	const pathname = usePathname();
	const cartCount = useSyncExternalStore(subscribe, getSnapshot, () => 0);
	const navLinks = [
		{ href: "/", label: "Home" },
		{ href: "/products", label: "Shop" },
		{ href: "/category/earrings", label: "Earrings" },
		{ href: "/category/necklaces", label: "Necklaces" },
		{ href: "/category/rings", label: "Rings" },
		{ href: "/category/bangles", label: "Bangles" },
	];

	const isActive = (href: string) => {
		if (href === "/products") return pathname === "/products" || pathname.startsWith("/products/");
		if (href.startsWith("/category/")) return pathname === href;
		return pathname === href;
	};

	useEffect(() => {
		if (!open && !searchOpen) return;
		const original = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = original;
		};
	}, [open, searchOpen]);

	return (
		<header className="fixed top-0 z-50 w-full border-b border-[var(--pp-border)] bg-[var(--pp-white)]/85 backdrop-blur">
			<div className="page-shell relative flex items-center justify-between py-4 md:py-5">
				<div className="flex items-center gap-3">
					<button
						className="lg:hidden p-2 text-[var(--pp-ink)] transition-colors hover:text-[var(--pp-gold)]"
						onClick={() => setOpen(true)}
						aria-label="Open menu"
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path d="M5 7H19" strokeWidth="1.8" strokeLinecap="round" />
							<path d="M5 12H19" strokeWidth="1.8" strokeLinecap="round" />
							<path d="M5 17H19" strokeWidth="1.8" strokeLinecap="round" />
						</svg>
					</button>
					<Link href="/" className="hidden font-[var(--font-heading)] text-2xl tracking-tight lg:block">
						{siteConfig.name}
					</Link>
				</div>
				<div className="absolute inset-0 flex items-center justify-center lg:hidden pointer-events-none">
					<Link
						href="/"
						className="pointer-events-auto font-[var(--font-heading)] text-xl tracking-tight"
					>
						{siteConfig.name}
					</Link>
				</div>
				<div className="flex items-center gap-2 lg:hidden">
					<button
						className="p-2 text-[var(--pp-ink)] transition-colors hover:text-[var(--pp-gold)]"
						aria-label="Search"
						onClick={() => {
							setOpen(false);
							setSearchOpen(true);
						}}
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<circle cx="11" cy="11" r="7" strokeWidth="1.6" />
							<path d="M20 20l-3.5-3.5" strokeWidth="1.6" strokeLinecap="round" />
						</svg>
					</button>
				</div>
				<nav className="hidden items-center gap-8 text-sm lg:flex">
					{navLinks.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`border-b-2 pb-1 transition-all duration-300 ${
								isActive(item.href)
									? "border-[var(--pp-gold)] text-[var(--pp-ink)]"
									: "border-transparent text-[var(--pp-ink)] hover:border-[var(--pp-gold)] hover:text-[var(--pp-gold)]"
							}`}
						>
							{item.label}
						</Link>
					))}
				</nav>
				<div className="hidden items-center gap-3 lg:flex">
					<SearchBar className="w-56 xl:w-64" />
					<Link
						href="/cart"
						className="relative rounded-full border border-[var(--pp-border)] p-2 transition-all hover:shadow-sm"
					>
						<span className="sr-only">Cart</span>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path d="M7 4H5L3 18H19L21 8H7" strokeWidth="1.5" strokeLinecap="round" />
							<circle cx="9" cy="20" r="1.5" />
							<circle cx="17" cy="20" r="1.5" />
						</svg>
						{cartCount > 0 && (
							<span
								key={cartCount}
								className="badge-pop absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--pp-gold)] px-1 text-[10px] font-semibold text-[var(--pp-ink)]"
							>
								{cartCount}
							</span>
						)}
					</Link>
					<Link
						href="/contact"
						className="rounded-full border border-[var(--pp-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition hover:border-[var(--pp-gold)]"
					>
						Contact Us
					</Link>
				</div>
			</div>
			<div
				className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
					searchOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
				}`}
			>
				<button
					className="absolute inset-0 bg-black/30"
					onClick={() => setSearchOpen(false)}
					aria-label="Close search"
				/>
				<div
					className={`absolute left-0 right-0 top-[64px] bg-white px-4 pb-4 pt-4 shadow-xl transition-transform duration-300 ${
						searchOpen ? "translate-y-0" : "-translate-y-full"
					}`}
				>
					<div className="flex items-center gap-2">
						<div className="flex h-10 w-10 items-center justify-center text-[var(--pp-muted)]">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<circle cx="11" cy="11" r="7" strokeWidth="1.6" />
								<path d="M20 20l-3.5-3.5" strokeWidth="1.6" strokeLinecap="round" />
							</svg>
						</div>
						<SearchBar
							className="w-full"
							mode="panel"
							inputClassName="border-0 bg-transparent text-base placeholder:text-[var(--pp-muted)]"
							hideResults
							onResultSelect={() => setSearchOpen(false)}
							onResults={(results, query, loading) => {
								setSearchResults(results);
								setSearchQuery(query);
								setSearchLoading(loading);
							}}
						/>
						<button
							className="flex h-10 w-10 items-center justify-center text-[var(--pp-ink)] transition-colors hover:text-[var(--pp-gold)]"
							onClick={() => setSearchOpen(false)}
							aria-label="Close search"
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path d="M6 6L18 18" strokeWidth="1.8" strokeLinecap="round" />
								<path d="M18 6L6 18" strokeWidth="1.8" strokeLinecap="round" />
							</svg>
						</button>
					</div>
					{searchQuery.trim() && (
						<div className="mt-3 border-t border-[var(--pp-border)] pt-3">
							{searchLoading ? (
								<p className="text-sm text-[var(--pp-muted)]">Searching…</p>
							) : searchResults.length > 0 ? (
								<div className="max-h-[50vh] overflow-auto rounded-2xl border border-[var(--pp-border)] bg-white p-3 shadow-xl">
									<div className="space-y-3">
										{searchResults.map((product) => (
											<Link
												key={product.id}
												href={`/products/${product.slug}`}
												className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[var(--pp-beige)]"
												onClick={() => setSearchOpen(false)}
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
											href={`/products?q=${encodeURIComponent(searchQuery)}`}
											className="block rounded-xl border border-[var(--pp-border)] px-3 py-2 text-center text-xs"
											onClick={() => setSearchOpen(false)}
										>
											View all results
										</Link>
									</div>
								</div>
							) : (
								<p className="text-sm text-[var(--pp-muted)]">No results found.</p>
							)}
						</div>
					)}
				</div>
			</div>
			<div
				className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
					open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
				}`}
			>
				<button
					className="absolute inset-0 z-0 bg-black/30"
					onClick={() => setOpen(false)}
					aria-label="Close menu"
				/>
				<div
					className={`absolute left-0 top-0 z-10 h-full w-[85%] max-w-sm bg-white shadow-xl transition-transform duration-300 ${
						open ? "translate-x-0" : "-translate-x-full"
					}`}
				>
					<div className="flex h-full flex-col">
						<div className="flex items-center justify-end px-6 pt-6">
							<button
								className="p-2 text-[var(--pp-ink)] transition-colors hover:text-[var(--pp-gold)]"
								onClick={() => setOpen(false)}
								aria-label="Close menu"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path d="M6 6L18 18" strokeWidth="1.8" strokeLinecap="round" />
									<path d="M18 6L6 18" strokeWidth="1.8" strokeLinecap="round" />
								</svg>
							</button>
						</div>
						<div className="mt-6 flex-1 overflow-y-auto px-6 pb-10 text-sm">
							<div className="space-y-4">
								{[{ href: "/", label: "Home" }, ...navLinks, ...navigation.slice(7, 9)].map(
									(item, index) => (
										<Link
											key={`${item.href}-${item.label}-${index}`}
											href={item.href}
											className="block border-b border-[var(--pp-border)] pb-3 text-base"
											onClick={() => setOpen(false)}
										>
											{item.label}
										</Link>
									)
								)}
							</div>
							<div className="mt-6 space-y-3">
								<Link
									href="/products?price=199"
									className="btn-primary btn-sweep block text-center text-sm"
									onClick={() => setOpen(false)}
								>
									<span className="btn-sweep-label">Shop under ₹199</span>
								</Link>
								<Link
									href="/contact"
									className="btn-secondary block text-center text-sm"
									onClick={() => setOpen(false)}
								>
									Contact Us
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
