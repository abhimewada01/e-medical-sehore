import { db } from '$lib/server/db';
import { orders, orderItems, prescriptions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user!.id;

	const [order] = await db.select().from(orders)
		.where(and(eq(orders.id, params.orderId), eq(orders.customerId, userId)));
	if (!order) error(404, 'Order not found');

	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

	let prescription = null;
	if (order.prescriptionId) {
		const rows = await db.select({
			id: prescriptions.id,
			originalFilename: prescriptions.originalFilename,
			status: prescriptions.status,
			pharmacistNotes: prescriptions.pharmacistNotes,
			rejectionReason: prescriptions.rejectionReason
		}).from(prescriptions).where(eq(prescriptions.id, order.prescriptionId));
		prescription = rows[0] ?? null;
	}

	return { order, items, prescription };
};
