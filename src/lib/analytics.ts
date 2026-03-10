export type AnalyticsEvent =
  | "product_click"
  | "whatsapp_click"
  | "filter_used"
  | "search_suggestion_click"
  | "wishlist_toggle";

export function trackEvent(event: AnalyticsEvent, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("pp_analytics", {
      detail: { event, payload, timestamp: Date.now() },
    })
  );
}
