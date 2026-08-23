export type CartItem = {
	id: string;
	name: string;
	slug: string;
	price: number;
	image: string;
	quantity: number;
};

const KEY = "pp_cart";
const CART_EVENT = "pp-cart-updated";

export function getCart(): CartItem[] {
	if (typeof window === "undefined") return [];
	const raw = window.localStorage.getItem(KEY);
	return raw ? (JSON.parse(raw) as CartItem[]) : [];
}

export function setCart(items: CartItem[]) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(KEY, JSON.stringify(items));
	window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: items }));
}

export function addToCart(
	item: Omit<CartItem, "quantity">,
	quantity = 1
) {
	const items = getCart();
	const existing = items.find((entry) => entry.id === item.id);
	const next = existing
		? items.map((entry) =>
				entry.id === item.id
					? { ...entry, quantity: Math.min(entry.quantity + quantity, 10) }
					: entry
			)
		: [...items, { ...item, quantity: Math.min(quantity, 10) }];
	setCart(next);
	return next;
}

export function setCartItemQuantity(
	item: Omit<CartItem, "quantity">,
	quantity: number
) {
	const items = getCart();
	if (quantity <= 0) {
		const next = items.filter((entry) => entry.id !== item.id);
		setCart(next);
		return next;
	}
	const nextQty = Math.min(quantity, 10);
	const exists = items.find((entry) => entry.id === item.id);
	const next = exists
		? items.map((entry) =>
				entry.id === item.id ? { ...entry, quantity: nextQty } : entry
			)
		: [...items, { ...item, quantity: nextQty }];
	setCart(next);
	return next;
}

export function updateCartItem(id: string, quantity: number) {
	const items = getCart();
	const next = items
		.map((entry) =>
			entry.id === id ? { ...entry, quantity: Math.max(1, Math.min(quantity, 10)) } : entry
		)
		.filter((entry) => entry.quantity > 0);
	setCart(next);
	return next;
}

export function removeCartItem(id: string) {
	const items = getCart();
	const next = items.filter((entry) => entry.id !== id);
	setCart(next);
	return next;
}

export function clearCart() {
	setCart([]);
}

export function getCartTotal(items: CartItem[]) {
	return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
