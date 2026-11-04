import { db } from '$lib/server/db';
import { orders, users } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import { getAdminStats } from '$lib/server/services/stats';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [stats, recentOrders] = await Promise.all([
		getAdminStats(),
		db.select({
			id: orders.id,
			orderNumber: orders.orderNumber,
			status: orders.status,
			grandTotal: orders.grandTotal,
			paymentMethod: orders.paymentMethod,
			createdAt: orders.createdAt,
			customerId: orders.customerId
		}).from(orders).orderBy(sql`${orders.createdAt} desc`).limit(10)
	]);

	// Get customer names for recent orders
	const customerIds = [...new Set(recentOrders.map(o => o.customerId))];
	const customerMap: Record<string, string> = {};
	if (customerIds.length > 0) {
		const customerNames = await db.select({ id: users.id, fullName: users.fullName })
			.from(users).where(sql`${users.id} = ANY(${customerIds})`);
		customerNames.forEach(c => customerMap[c.id] = c.fullName);
	}

	const ordersWithCustomers = recentOrders.map(o => ({ ...o, customerName: customerMap[o.customerId] ?? 'Unknown' }));

	return {
		stats,
		recentOrders: ordersWithCustomers
	};
};
