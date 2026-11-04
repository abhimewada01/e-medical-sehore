export type CartItem = { qty: number; name: string; price: number; rx: boolean };
export type Cart = Record<string, CartItem>;

export const DELIVERY_FEE = 40;
export const FREE_DELIVERY_THRESHOLD = 500;

export function cartItems(cart: Cart) {
	return Object.entries(cart).map(([id, item]) => ({ id, ...item }));
}

export function cartSubtotal(items: { qty: number; price: number }[]) {
	return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function deliveryFeeFor(subtotal: number, threshold = FREE_DELIVERY_THRESHOLD, fee = DELIVERY_FEE) {
	return subtotal >= threshold ? 0 : fee;
}

export function cartTotals(
	items: { qty: number; price: number }[],
	loyaltyDiscount = 0
) {
	const subtotal = cartSubtotal(items);
	const deliveryFee = deliveryFeeFor(subtotal);
	const grandTotal = Math.max(0, subtotal + deliveryFee - loyaltyDiscount);
	return { subtotal, deliveryFee, grandTotal };
}
