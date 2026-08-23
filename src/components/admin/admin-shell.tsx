"use client";

import { useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminToastProvider from "@/components/admin/admin-toast-provider";
import { ToastContext } from "@/components/admin/admin-toast-provider";
import { LogOut, Mail } from "lucide-react";
import AdminConfirmModal from "@/components/admin/admin-confirm-modal";

const pageTitles = [
	{ href: "/admin", label: "Dashboard" },
	{ href: "/admin/products", label: "Products" },
	{ href: "/admin/media", label: "Media" },
	{ href: "/admin/banners", label: "Banners" },
	{ href: "/admin/categories", label: "Categories" },
	{ href: "/admin/subcategories", label: "Sub Categories" },
	{ href: "/admin/orders", label: "Orders" },
	{ href: "/admin/contacts", label: "Contacts" },
	{ href: "/admin/audit-logs", label: "Audit Logs" },
	{ href: "/admin/settings", label: "Settings" },
];

function AdminShellBody({
	children,
	initialCollapsed,
}: {
	children: React.ReactNode;
	initialCollapsed: boolean;
}) {
	const pathname = usePathname();
	const toastContext = useContext(ToastContext);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [logoutOpen, setLogoutOpen] = useState(false);
	const [logoutLoading, setLogoutLoading] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const [badgePulse, setBadgePulse] = useState(0);
	const sidebarCollapsed = useSyncExternalStore(
		(callback) => {
			if (typeof window === "undefined") return () => undefined;
			const handler = () => callback();
			window.addEventListener("storage", handler);
			window.addEventListener("pp-admin-sidebar", handler);
			return () => {
				window.removeEventListener("storage", handler);
				window.removeEventListener("pp-admin-sidebar", handler);
			};
		},
		() => {
			if (typeof window === "undefined") return initialCollapsed;
			const cookieMatch = document.cookie.match(/(?:^|; )pp-admin-sidebar-collapsed=([^;]+)/);
			if (cookieMatch) return cookieMatch[1] === "1";
			return initialCollapsed;
		},
		() => initialCollapsed
	);

	const pageTitle = useMemo(() => {
		const match = pageTitles.find((item) => {
			if (item.href === "/admin") return pathname === "/admin";
			return pathname.startsWith(item.href);
		});
		return match?.label ?? "Admin";
	}, [pathname]);

	const testToasts = () => {
		toastContext?.pushToast({ message: "Success toast", type: "success" });
		toastContext?.pushToast({ message: "Error toast", type: "error" });
		toastContext?.pushToast({ message: "Warning toast", type: "warning" });
		toastContext?.pushToast({ message: "Primary toast", type: "primary" });
	};

	const toggleSidebarCollapsed = () => {
		if (typeof window === "undefined") return;
		const next = !sidebarCollapsed;
		window.localStorage.setItem("pp-admin-sidebar-collapsed", next ? "1" : "0");
		document.cookie = `pp-admin-sidebar-collapsed=${next ? "1" : "0"}; path=/; max-age=31536000`;
		window.dispatchEvent(new Event("pp-admin-sidebar"));
	};

	useEffect(() => {
		let mounted = true;
		const fetchUnread = async () => {
			try {
				const response = await fetch("/api/admin/contacts/unread", { cache: "no-store" });
				if (!response.ok) return;
				const data = (await response.json()) as { total?: number };
				if (mounted) setUnreadCount(data.total ?? 0);
			} catch {
				// ignore network errors
			}
		};
		fetchUnread();
		const interval = window.setInterval(fetchUnread, 30000);
		const handleRefresh = () => {
			fetchUnread();
		};
		const handleOptimistic = (event: Event) => {
			const custom = event as CustomEvent<{ delta?: number }>;
			const delta = typeof custom.detail?.delta === "number" ? custom.detail.delta : 0;
			if (!delta) return;
			setUnreadCount((prev) => Math.max(0, prev + delta));
			setBadgePulse((prev) => prev + 1);
		};
		window.addEventListener("pp-contacts-refresh", handleRefresh);
		window.addEventListener("pp-contacts-unread-delta", handleOptimistic);
		return () => {
			mounted = false;
			window.clearInterval(interval);
			window.removeEventListener("pp-contacts-refresh", handleRefresh);
			window.removeEventListener("pp-contacts-unread-delta", handleOptimistic);
		};
	}, []);

	return (
		<div
			className={`admin-shell min-h-screen bg-[var(--pp-beige)] transition-[padding] duration-300 ease-out ${
				sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
			}`}
			style={
				{
					"--admin-sidebar-offset": sidebarCollapsed ? "5rem" : "18rem",
				} as React.CSSProperties
			}
		>
			<AdminConfirmModal
				open={logoutOpen}
				title="Log out?"
				description="You’ll need to sign in again to access the admin panel."
				confirmLabel="Log out"
				loadingLabel="Logging out…"
				status="warning"
				onConfirm={() => {
					setLogoutLoading(true);
					signOut({ callbackUrl: "/admin/login" });
				}}
				onCancel={() => setLogoutOpen(false)}
				loading={logoutLoading}
			/>
			<AdminSidebar
				mobileOpen={sidebarOpen}
				onClose={() => setSidebarOpen(false)}
				collapsed={sidebarCollapsed}
				onTestToasts={testToasts}
			/>
			<div className="flex min-w-0 flex-1 flex-col min-h-0">
				<header className="sticky top-0 z-30 border-b border-[var(--pp-border)] bg-white/80 px-6 py-4 backdrop-blur transition-[padding] duration-300 ease-out">
					<div className="flex w-full items-center justify-between">
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => setSidebarOpen(true)}
								className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)] lg:hidden"
								aria-label="Open sidebar"
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<path d="M3 6h18" strokeWidth="1.6" strokeLinecap="round" />
									<path d="M3 12h18" strokeWidth="1.6" strokeLinecap="round" />
									<path d="M3 18h18" strokeWidth="1.6" strokeLinecap="round" />
								</svg>
							</button>
							<button
								type="button"
								onClick={toggleSidebarCollapsed}
								className="hidden h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)] lg:flex"
								aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<rect x="3" y="4" width="4" height="16" rx="1.5" strokeWidth="1.6" />
									<rect x="9" y="4" width="12" height="16" rx="1.5" strokeWidth="1.6" />
									{sidebarCollapsed ? (
										<path d="M14 9l4 3-4 3" strokeWidth="1.6" strokeLinecap="round" />
									) : (
										<path d="M16 9l-4 3 4 3" strokeWidth="1.6" strokeLinecap="round" />
									)}
								</svg>
							</button>
							<h1 className="text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">
								{pageTitle}
							</h1>
						</div>
						<div className="flex items-center gap-3">
							<Link
								href="/admin/contacts"
								className="group relative inline-flex h-11 w-11 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
								aria-label="Inbox"
								title="Inbox"
								onClick={() => {
									if (typeof window === "undefined") return;
									window.sessionStorage.setItem("pp-contacts-force-refresh", "1");
									window.dispatchEvent(new Event("pp-contacts-refresh"));
									window.dispatchEvent(new Event("pp-contacts-reload"));
								}}
							>
								<Mail className="h-5 w-5" />
								{unreadCount > 0 && (
									<span
										key={badgePulse}
										className="absolute right-1.5 top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--pp-gold)] px-1.5 text-[10px] font-semibold text-[var(--pp-ink)] transition duration-200 animate-[badge-pop_200ms_ease-out]"
									>
										{unreadCount > 99 ? "99+" : unreadCount}
									</span>
								)}
								<span className="pointer-events-none absolute right-0 top-full mt-2 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2.5 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:opacity-100 md:block">
									Inbox
								</span>
							</Link>
							<button
								type="button"
								className="group relative inline-flex h-11 w-11 items-center justify-center text-red-600 transition hover:text-red-700"
								aria-label="Log out"
								onClick={() => setLogoutOpen(true)}
								disabled={logoutLoading}
							>
								<LogOut className="h-5 w-5" />
								<span className="pointer-events-none absolute right-0 top-full mt-2 hidden whitespace-nowrap border border-[var(--pp-border)] bg-white px-2.5 py-1 text-xs text-[var(--pp-ink)] opacity-0 shadow-sm transition group-hover:opacity-100 md:block">
									Log out
								</span>
							</button>
						</div>
					</div>
				</header>
				<main className="admin-main relative flex-1 transition-[padding] duration-300 ease-out admin-fade-in">
					<div className="px-6 py-8">{children}</div>
				</main>
			</div>
		</div>
	);
}

export default function AdminShell({
	children,
	initialCollapsed = false,
}: {
	children: React.ReactNode;
	initialCollapsed?: boolean;
}) {
	return (
		<AdminToastProvider>
			<AdminShellBody initialCollapsed={initialCollapsed}>{children}</AdminShellBody>
		</AdminToastProvider>
	);
}
