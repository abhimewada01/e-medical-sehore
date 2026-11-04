import { db } from '$lib/server/db';
import { orders, orderItems } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const orderList = await db.select({
		id: orders.id,
		orderNumber: orders.orderNumber,
		status: orders.status,
		grandTotal: orders.grandTotal,
		paymentMethod: orders.paymentMethod,
		paymentStatus: orders.paymentStatus,
		fulfillmentType: orders.fulfillmentType,
		pickupToken: orders.pickupToken,
		prescriptionId: orders.prescriptionId,
		createdAt: orders.createdAt
	}).from(orders).where(eq(orders.customerId, userId)).orderBy(desc(orders.createdAt));
	return { orders: orderList };
};
