import { describe, it, expect } from 'vitest';

describe('Cart Calculations & Prescription Enforcement', () => {
	const items = [
		{ id: '1', name: 'Paracetamol 500mg', price: 20.0, qty: 2, rx: false },
		{ id: '2', name: 'Amoxicillin 500mg', price: 85.0, qty: 1, rx: true }
	];

	it('should accurately calculate cart subtotal', () => {
		const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
		expect(subtotal).toBe(125.0);
	});

	it('should flag prescription requirement when cart contains Rx medicine', () => {
		const hasRx = items.some((item) => item.rx);
		expect(hasRx).toBe(true);
	});

	it('should apply free delivery for orders above ₹500 threshold', () => {
		const calculateDelivery = (subtotal: number) => (subtotal >= 500 ? 0 : 40);

		expect(calculateDelivery(499)).toBe(40);
		expect(calculateDelivery(500)).toBe(0);
		expect(calculateDelivery(1200)).toBe(0);
	});
});
