"use client";

import { useEffect, useState } from "react";
import { openWhatsApp } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";
import { getCart, setCartItemQuantity } from "@/lib/cart";
import { useStorefrontSettings } from "@/components/storefront/storefront-settings-provider";

interface ProductOrderActionsProps {
	id: string;
	name: string;
	price: number;
	productUrl: string;
	image: string;
	isLaunchMode?: boolean;
}

export default function ProductOrderActions({
	id,
	name,
	price,
	productUrl,
	image,
	isLaunchMode = false,
}: ProductOrderActionsProps) {
	const { whatsappNumber } = useStorefrontSettings();
	const [quantity, setQuantity] = useState(1);
	const [isInCart, setIsInCart] = useState(false);
	const [added, setAdded] = useState(false);

	useEffect(() => {
		const checkCart = () => {
			const items = getCart();
			setIsInCart(items.some((item) => item.id === id));
		};

		checkCart();
		window.addEventListener("pp-cart-updated", checkCart);
		return () => window.removeEventListener("pp-cart-updated", checkCart);
	}, [id]);

	const quantityLine = quantity > 1 ? `\nQuantity: ${quantity}` : "";
	const message = `Hi, I want to order this product:\n\nProduct: ${name}\nPrice: ₹${price}${quantityLine}\nLink: ${productUrl}`;

	const updateQuantity = (next: number) => {
		setQuantity(Math.max(1, Math.min(next, 10)));
	};

	const handleWhatsAppClick = () => {
		trackEvent("whatsapp_click", { product: name, quantity });
		// Fire-and-forget order intent recording
		fetch("/api/orders/whatsapp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ items: [{ productId: id, quantity }], source: "product" }),
		}).catch(() => { });
		openWhatsApp(message, whatsappNumber);
	};

	return (
		<div className="mt-8 space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex h-12 w-full items-center justify-between rounded-2xl border border-[var(--pp-border)] bg-white px-6 shadow-sm sm:w-auto sm:justify-start sm:gap-6">
					<span className="text-[10px] font-bold uppercase tracking-widest text-[var(--pp-muted)]">Qty</span>
					<div className="flex items-center gap-6">
						<button
							className="flex h-8 w-8 items-center justify-center text-xl transition-colors hover:text-[var(--pp-gold)] disabled:opacity-30"
							onClick={() => updateQuantity(quantity - 1)}
							disabled={quantity <= 1 || isLaunchMode}
							aria-label="Decrease quantity"
						>
							−
						</button>
						<span className="min-w-[12px] text-center text-base font-bold tabular-nums">{quantity}</span>
						<button
							className="flex h-8 w-8 items-center justify-center text-xl transition-colors hover:text-[var(--pp-gold)] disabled:opacity-30"
							onClick={() => updateQuantity(quantity + 1)}
							disabled={quantity >= 10 || isLaunchMode}
							aria-label="Increase quantity"
						>
							+
						</button>
					</div>
				</div>
				<button
					className={`btn-sweep h-12 flex-1 rounded-2xl border-none px-8 text-[11px] font-bold uppercase tracking-[0.15em] transition-all sm:flex-initial ${added || isInCart ? "cart-pop ring-2 ring-[var(--pp-gold)]/30" : ""} ${isLaunchMode ? "opacity-50 cursor-not-allowed bg-[var(--pp-muted)]/10 text-[var(--pp-muted)]" : ""}`}
					disabled={isLaunchMode}
					onClick={() => {
						if (isLaunchMode) return;
						
						setCartItemQuantity(
							{
								id,
								name,
								slug: productUrl.split("/").pop() ?? id,
								price,
								image,
							},
							quantity
						);
						trackEvent("add_to_cart", { product: name, quantity });
						setAdded(true);
						window.setTimeout(() => setAdded(false), 2000);
					}}
				>
					<span className="btn-sweep-label">
						{added ? "Successfully Added" : isInCart ? "In Bag" : isLaunchMode ? "Launching Soon" : "Add to Bag"}
					</span>
				</button>
				<button
					type="button"
					className={`h-12 rounded-2xl bg-[#25D366] px-6 text-[11px] font-bold uppercase tracking-[0.15em] text-white shadow-sm transition-all hover:bg-[#1fba59] active:scale-[0.99] sm:flex-initial ${isLaunchMode ? "cursor-not-allowed opacity-50" : ""}`}
					disabled={isLaunchMode}
					onClick={() => {
						if (isLaunchMode) return;
						handleWhatsAppClick();
					}}
				>
					Order on WhatsApp
				</button>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{[
					{ label: "Premium Packaging", icon: "✨" },
					{ label: "Express Delivery", icon: "🚚" },
					{ label: "Quality Assured", icon: "💎" }
				].map((item, idx) => (
					<div
						key={item.label}
						className={`flex items-center justify-center gap-2 rounded-2xl border border-[var(--pp-border)] bg-white/50 px-3 py-4 text-center ${idx === 2 ? "col-span-2 sm:col-span-1" : ""}`}
					>
						<span className="text-sm">{item.icon}</span>
						<span className="text-[9px] font-bold uppercase tracking-widest text-[var(--pp-muted)]">{item.label}</span>
					</div>
				))}
			</div>
		</div>
	);
}
