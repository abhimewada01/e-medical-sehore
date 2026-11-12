import { db } from '$lib/server/db';
import { loyaltyWallets, loyaltyTransactions } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const wallet = await db.select().from(loyaltyWallets).where(eq(loyaltyWallets.userId, userId)).then(r => r[0] ?? null);
	const transactions = wallet ? await db.select().from(loyaltyTransactions)
		.where(eq(loyaltyTransactions.walletId, wallet.id))
		.orderBy(desc(loyaltyTransactions.createdAt))
		.limit(30) : [];
	return { wallet, transactions };
};
