export type AnalyticsEvent =
	| "product_click"
	| "whatsapp_click"
	| "whatsapp_fab_click"
	| "whatsapp_cart_click"
	| "filter_used"
	| "search_suggestion_click"
	| "wishlist_toggle"
	| "add_to_cart"
	| "remove_from_cart"
	| "cart_qty_increase"
	| "cart_qty_decrease"
	| "load_more_products";

export function trackEvent(event: AnalyticsEvent, payload?: Record<string, unknown>) {
	if (typeof window === "undefined") return;
	window.dispatchEvent(
		new CustomEvent("pp_analytics", {
			detail: { event, payload, timestamp: Date.now() },
		})
	);
}
