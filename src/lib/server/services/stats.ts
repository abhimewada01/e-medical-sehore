import { db } from '$lib/server/db';
import { orders, users, medicines, prescriptions } from '$lib/server/db/schema';
import { eq, count, sql, and, gte } from 'drizzle-orm';

export async function getAdminStats() {
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

	const [
		totalOrders,
		pendingOrders,
		completedOrders,
		cancelledOrders,
		totalCustomers,
		totalMedicines,
		lowStockMedicines,
		pendingPrescriptions,
		revenueResult,
		monthlyRevenue
	] = await Promise.all([
		db.select({ count: count() }).from(orders).then((r) => r[0].count),
		db.select({ count: count() }).from(orders).where(eq(orders.status, 'PENDING')).then((r) => r[0].count),
		db.select({ count: count() }).from(orders).where(eq(orders.status, 'DELIVERED')).then((r) => r[0].count),
		db.select({ count: count() }).from(orders).where(eq(orders.status, 'CANCELLED')).then((r) => r[0].count),
		db.select({ count: count() }).from(users).where(eq(users.role, 'CUSTOMER')).then((r) => r[0].count),
		db.select({ count: count() }).from(medicines).where(eq(medicines.isActive, true)).then((r) => r[0].count),
		db
			.select({ count: count() })
			.from(medicines)
			.where(and(eq(medicines.isActive, true), sql`${medicines.stockQuantity} <= ${medicines.minStockAlert}`))
			.then((r) => r[0].count),
		db
			.select({ count: count() })
			.from(prescriptions)
			.where(eq(prescriptions.status, 'PENDING_VERIFICATION'))
			.then((r) => r[0].count),
		db
			.select({ total: sql<number>`coalesce(sum(${orders.grandTotal}), 0)` })
			.from(orders)
			.where(eq(orders.status, 'DELIVERED'))
			.then((r) => r[0]),
		db
			.select({ total: sql<number>`coalesce(sum(${orders.grandTotal}), 0)` })
			.from(orders)
			.where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, monthStart)))
			.then((r) => r[0])
	]);

	return {
		totalOrders: Number(totalOrders),
		pendingOrders: Number(pendingOrders),
		completedOrders: Number(completedOrders),
		cancelledOrders: Number(cancelledOrders),
		totalCustomers: Number(totalCustomers),
		totalMedicines: Number(totalMedicines),
		lowStockMedicines: Number(lowStockMedicines),
		pendingPrescriptions: Number(pendingPrescriptions),
		totalRevenue: Number(revenueResult.total),
		monthlyRevenue: Number(monthlyRevenue.total)
	};
}
