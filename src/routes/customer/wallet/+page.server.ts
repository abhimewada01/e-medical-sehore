import { db } from '$lib/server/db';
import { loyaltyWallets, loyaltyTransactions } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const [wallet, transactions] = await Promise.all([
		db.select().from(loyaltyWallets).where(eq(loyaltyWallets.userId, userId)).then(r => r[0] ?? null),
		db.select().from(loyaltyTransactions)
			.where(eq(loyaltyTransactions.walletId, userId)) // will be overridden below
			.then(() => []) // placeholder - real query needs join
	]);

	// Get transactions via wallet id
	let txList: any[] = [];
	if (wallet) {
		txList = await db.select().from(loyaltyTransactions)
			.where(eq(loyaltyTransactions.walletId, wallet.id))
			.orderBy(desc(loyaltyTransactions.createdAt))
			.limit(30);
	}

	return { wallet, transactions: txList };
};
