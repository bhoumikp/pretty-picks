"use client";

import { useState } from "react";
import { openWhatsApp } from "@/lib/whatsapp";
import { trackEvent } from "@/lib/analytics";
import { setCartItemQuantity } from "@/lib/cart";

interface ProductOrderActionsProps {
	id: string;
	name: string;
	price: number;
	productUrl: string;
	image: string;
}

export default function ProductOrderActions({
	id,
	name,
	price,
	productUrl,
	image,
}: ProductOrderActionsProps) {
	const [quantity, setQuantity] = useState(1);
	const [added, setAdded] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);

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
		}).catch(() => {});
		openWhatsApp(message);
	};

	return (
		<div className="mt-8 space-y-5">
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex items-center gap-3 rounded-full border border-[var(--pp-border)] bg-white px-4 py-2 text-sm shadow-sm">
					<span className="text-[var(--pp-muted)]">Qty</span>
					<div className="flex items-center gap-2">
						<button
							className="h-7 w-7 rounded-full border border-[var(--pp-border)] text-sm"
							onClick={() => updateQuantity(quantity - 1)}
							aria-label="Decrease quantity"
						>
							-
						</button>
						<span className="min-w-[16px] text-center font-medium">{quantity}</span>
						<button
							className="h-7 w-7 rounded-full border border-[var(--pp-border)] text-sm"
							onClick={() => updateQuantity(quantity + 1)}
							aria-label="Increase quantity"
						>
							+
						</button>
					</div>
				</div>
				<button
					className={`btn-outline text-sm transition-all ${added ? "cart-pop ring-2 ring-[var(--pp-gold)]/30" : ""}`}
					onClick={() => {
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
						window.setTimeout(() => setAdded(false), 600);
					}}
				>
					{added ? "Added" : "Add to cart"}
				</button>
				<button
					className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#1fba59] active:scale-95"
					onClick={() => setShowConfirmModal(true)}
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
					</svg>
					Order on WhatsApp
				</button>
			</div>
			<div className="grid gap-3 text-xs text-[var(--pp-muted)] sm:grid-cols-3">
				{["Secure packaging", "Fast delivery", "Affordable pricing"].map((item) => (
					<div
						key={item}
						className="rounded-full border border-[var(--pp-border)] bg-[var(--pp-beige)]/70 px-3 py-2 text-center"
					>
						{item}
					</div>
				))}
			</div>
			{showConfirmModal && (
				<div 
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 opacity-0 animate-in fade-in duration-200" 
					style={{ animationFillMode: 'forwards' }}
					onClick={() => setShowConfirmModal(false)}
				>
					<div 
						className="w-full max-w-sm scale-95 transform rounded-3xl bg-white p-6 shadow-xl transition-all animate-in zoom-in-95 duration-200" 
						style={{ animationFillMode: 'forwards' }}
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">Ready to place your order?</h3>
						<p className="mt-3 text-sm text-[var(--pp-muted)] leading-relaxed">
							You&apos;ll be redirected to WhatsApp to confirm your selected items and shipping details directly with our team.
						</p>
						<div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
							<button
								className="w-full sm:w-auto rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--pp-ink)] hover:bg-[var(--pp-beige)] transition-colors active:scale-95"
								onClick={() => setShowConfirmModal(false)}
							>
								Cancel
							</button>
							<button
								className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(37,211,102,0.39)] transition-all hover:bg-[#1DA851] active:scale-95"
								onClick={() => {
									setShowConfirmModal(false);
									handleWhatsAppClick();
								}}
							>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
								</svg>
								Continue to WhatsApp
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
