import { db } from '$lib/server/db';
import { orders, users } from '$lib/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ORDER_STATUSES, isOrderStatus } from '$lib/server/orders';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
	const limit = 25;

	const conditions = status ? eq(orders.status, status) : undefined;

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
		createdAt: orders.createdAt,
		customerId: orders.customerId
	}).from(orders)
		.where(conditions)
		.orderBy(desc(orders.createdAt))
		.limit(limit)
		.offset((page - 1) * limit);

	// Get customer names
	const customerIds = [...new Set(orderList.map(o => o.customerId))];
	const customerMap: Record<string, string> = {};
	if (customerIds.length > 0) {
		const names = await db.select({ id: users.id, fullName: users.fullName }).from(users)
			.where(inArray(users.id, customerIds));
		names.forEach(c => customerMap[c.id] = c.fullName);
	}

	const ordersWithCustomers = orderList.map(o => ({ ...o, customerName: customerMap[o.customerId] ?? 'Unknown' }));

	return { orders: ordersWithCustomers, statuses: ORDER_STATUSES, selectedStatus: status, page };
};

export const actions: Actions = {
	updateStatus: async ({ request }) => {
		const data = Object.fromEntries(await request.formData());
		const { orderId, status } = data;
		if (!orderId || !status || !isOrderStatus(status as string)) {
			return fail(400, { error: 'Invalid input' });
		}
		const updates: any = { status, updatedAt: new Date() };
		if (status === 'DELIVERED' || status === 'PICKED_UP') updates.deliveredAt = new Date();
		if (status === 'CANCELLED') updates.cancelledAt = new Date();
		await db.update(orders).set(updates).where(eq(orders.id, orderId as string));
	}
};
