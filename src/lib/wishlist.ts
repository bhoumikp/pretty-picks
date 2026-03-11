export type WishlistItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
};

const KEY = "pp_wishlist";
const WISHLIST_EVENT = "pp-wishlist-updated";

export function getWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
}

export function setWishlist(items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: items }));
}

export function toggleWishlist(item: WishlistItem) {
  const items = getWishlist();
  const exists = items.find((entry) => entry.id === item.id);
  const next = exists ? items.filter((entry) => entry.id !== item.id) : [...items, item];
  setWishlist(next);
  return next;
}

export function isWishlisted(id: string) {
  const items = getWishlist();
  return items.some((entry) => entry.id === id);
}
