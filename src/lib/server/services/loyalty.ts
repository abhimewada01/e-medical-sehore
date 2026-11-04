import { db } from '../db';
import { loyaltyWallets, loyaltyTransactions } from '../db/schema';
import { eq } from 'drizzle-orm';

export const COIN_EXPIRY_DAYS = 30;

export function coinsExpiryDate(from = new Date(), days = COIN_EXPIRY_DAYS) {
	return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function loyaltyRedemption(
	requestedCoins: number,
	balance: number,
	maxCoinsPerOrder: number,
	coinValueRupees: number
) {
	const coinsToRedeem = Math.max(0, Math.min(requestedCoins, maxCoinsPerOrder, balance));
	return {
		coinsToRedeem,
		discount: coinsToRedeem * coinValueRupees
	};
}

export async function getOrCreateWallet(userId: string) {
	let [wallet] = await db.select().from(loyaltyWallets).where(eq(loyaltyWallets.userId, userId));
	if (!wallet) {
		[wallet] = await db.insert(loyaltyWallets).values({ userId }).returning();
	}
	return wallet;
}

export async function creditCoins(userId: string, coins: number, orderId: string, note: string) {
	return db.transaction(async (tx) => {
		let [wallet] = await tx
			.select()
			.from(loyaltyWallets)
			.where(eq(loyaltyWallets.userId, userId))
			.for('update');
		if (!wallet) {
			[wallet] = await tx.insert(loyaltyWallets).values({ userId }).returning();
		}
		const expiresAt = coinsExpiryDate();
		await tx
			.update(loyaltyWallets)
			.set({
				balanceCoins: wallet.balanceCoins + coins,
				totalEarnedCoins: wallet.totalEarnedCoins + coins,
				updatedAt: new Date()
			})
			.where(eq(loyaltyWallets.id, wallet.id));
		await tx.insert(loyaltyTransactions).values({
			walletId: wallet.id,
			orderId,
			type: 'CREDIT_ORDER',
			coins,
			previousBalance: wallet.balanceCoins,
			newBalance: wallet.balanceCoins + coins,
			expiresAt,
			referenceNote: note
		});
		return wallet.balanceCoins + coins;
	});
}

export async function redeemCoins(userId: string, coins: number, orderId: string) {
	return db.transaction(async (tx) => {
		const [wallet] = await tx
			.select()
			.from(loyaltyWallets)
			.where(eq(loyaltyWallets.userId, userId))
			.for('update');
		if (!wallet || wallet.balanceCoins < coins) throw new Error('Insufficient coins');
		await tx
			.update(loyaltyWallets)
			.set({
				balanceCoins: wallet.balanceCoins - coins,
				totalRedeemedCoins: wallet.totalRedeemedCoins + coins,
				updatedAt: new Date()
			})
			.where(eq(loyaltyWallets.id, wallet.id));
		await tx.insert(loyaltyTransactions).values({
			walletId: wallet.id,
			orderId,
			type: 'DEBIT_REDEMPTION',
			coins: -coins,
			previousBalance: wallet.balanceCoins,
			newBalance: wallet.balanceCoins - coins,
			referenceNote: `Redeemed for order`
		});
		return wallet.balanceCoins - coins;
	});
}
