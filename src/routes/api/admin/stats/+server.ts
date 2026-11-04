import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { orders, medicines, users, prescriptions } from '$lib/server/db/schema';
import { count, eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !['SUPER_ADMIN', 'PHARMACY_ADMIN', 'PHARMACIST'].includes(locals.user.role)) {
		error(403, 'Forbidden');
	}

	const [
		totalOrders,
		pendingOrders,
		totalRevenue,
		totalMedicines,
		pendingPrescriptions,
		totalCustomers
	] = await Promise.all([
		db.select({ count: count() }).from(orders).then(r => r[0].count),
		db.select({ count: count() }).from(orders).where(eq(orders.status, 'PENDING')).then(r => r[0].count),
		db.select({ total: sql<number>`coalesce(sum(${orders.grandTotal}), 0)` }).from(orders).where(eq(orders.status, 'DELIVERED')).then(r => r[0].total),
		db.select({ count: count() }).from(medicines).where(eq(medicines.isActive, true)).then(r => r[0].count),
		db.select({ count: count() }).from(prescriptions).where(eq(prescriptions.status, 'PENDING_VERIFICATION')).then(r => r[0].count),
		db.select({ count: count() }).from(users).where(eq(users.role, 'CUSTOMER')).then(r => r[0].count)
	]);

	return json({
		totalOrders: Number(totalOrders),
		pendingOrders: Number(pendingOrders),
		totalRevenue: Number(totalRevenue),
		totalMedicines: Number(totalMedicines),
		pendingPrescriptions: Number(pendingPrescriptions),
		totalCustomers: Number(totalCustomers)
	});
};
