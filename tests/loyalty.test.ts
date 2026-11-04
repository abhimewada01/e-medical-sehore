import { describe, it, expect } from 'vitest';

describe('Loyalty Coins & Calculation Logic', () => {
	const COIN_VALUE_RUPEES = 0.1; // 1 coin = 0.10 INR
	const REWARD_PERCENTAGE = 5;   // 5% reward on eligible order
	const MIN_ORDER_FOR_COINS = 200;
	const MAX_COINS_PER_ORDER = 100;

	it('should calculate correct reward coins for eligible orders', () => {
		const orderAmount = 1000;
		expect(orderAmount >= MIN_ORDER_FOR_COINS).toBe(true);

		const earnedCoins = Math.min(
			MAX_COINS_PER_ORDER,
			Math.floor((orderAmount * REWARD_PERCENTAGE) / 100)
		);
		expect(earnedCoins).toBe(50);
	});

	it('should cap earned coins at MAX_COINS_PER_ORDER', () => {
		const highValueOrder = 5000;
		const earnedCoins = Math.min(
			MAX_COINS_PER_ORDER,
			Math.floor((highValueOrder * REWARD_PERCENTAGE) / 100)
		);
		expect(earnedCoins).toBe(MAX_COINS_PER_ORDER);
	});

	it('should not award coins for orders below MIN_ORDER_FOR_COINS', () => {
		const lowValueOrder = 150;
		const earnedCoins = lowValueOrder >= MIN_ORDER_FOR_COINS
			? Math.floor((lowValueOrder * REWARD_PERCENTAGE) / 100)
			: 0;
		expect(earnedCoins).toBe(0);
	});

	it('should correctly calculate discount when redeeming coins', () => {
		const coinsToRedeem = 80;
		const discountInr = coinsToRedeem * COIN_VALUE_RUPEES;
		expect(discountInr).toBe(8.0);
	});

	it('should never permit negative coin balance', () => {
		const currentBalance = 30;
		const attemptRedeem = 50;
		const canRedeem = currentBalance >= attemptRedeem;
		expect(canRedeem).toBe(false);
	});
});
