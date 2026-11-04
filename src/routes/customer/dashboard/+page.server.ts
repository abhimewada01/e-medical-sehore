import { db } from '$lib/server/db';
import { orders, loyaltyWallets, notifications } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const [recentOrders, wallet, unreadCount] = await Promise.all([
		db.select({
			id: orders.id,
			orderNumber: orders.orderNumber,
			status: orders.status,
			grandTotal: orders.grandTotal,
			paymentMethod: orders.paymentMethod,
			createdAt: orders.createdAt
		}).from(orders)
			.where(eq(orders.customerId, userId))
			.orderBy(desc(orders.createdAt))
			.limit(5),
		db.select().from(loyaltyWallets).where(eq(loyaltyWallets.userId, userId)).limit(1).then(r => r[0] ?? null),
		db.select({ id: notifications.id }).from(notifications)
			.where(eq(notifications.userId, userId))
			.then(r => r.filter(n => !(n as any).isRead).length)
	]);

	return { recentOrders, wallet, notificationCount: unreadCount };
};
