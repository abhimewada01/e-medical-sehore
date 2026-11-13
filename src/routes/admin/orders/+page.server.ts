import { db } from '$lib/server/db';
import { orders, users } from '$lib/server/db/schema';
import { eq, desc, inArray, count } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ORDER_STATUSES, isOrderStatus } from '$lib/server/orders';
import { OrderWorkflowError, transitionAdminOrder } from '$lib/server/services/order-workflow';

export const load: PageServerLoad = async ({ url }) => {
	const requestedStatus = url.searchParams.get('status') ?? '';
	const status = ORDER_STATUSES.includes(requestedStatus as (typeof ORDER_STATUSES)[number]) ? requestedStatus : '';
	const requestedPage = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	const limit = 25;

	const conditions = status ? eq(orders.status, status) : undefined;
	const [totalRow] = await db.select({ total: count() }).from(orders).where(conditions);
	const totalOrders = Number(totalRow?.total ?? 0);
	const totalPages = Math.max(1, Math.ceil(totalOrders / limit));
	const currentPage = Math.min(page, totalPages);

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
		.offset((currentPage - 1) * limit);

	// Get customer names
	const customerIds = [...new Set(orderList.map(o => o.customerId))];
	const customerMap: Record<string, string> = {};
	if (customerIds.length > 0) {
		const names = await db.select({ id: users.id, fullName: users.fullName }).from(users)
			.where(inArray(users.id, customerIds));
		names.forEach(c => customerMap[c.id] = c.fullName);
	}

	const ordersWithCustomers = orderList.map(o => ({ ...o, customerName: customerMap[o.customerId] ?? 'Unknown' }));

	return { orders: ordersWithCustomers, statuses: ORDER_STATUSES, selectedStatus: status, page: currentPage, totalOrders, totalPages, limit };
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		const data = Object.fromEntries(await request.formData());
		const { orderId, status } = data;
		if (!orderId || !status || !isOrderStatus(status as string)) {
			return fail(400, { error: 'Invalid input' });
		}
		try {
			await transitionAdminOrder(orderId as string, status as string, { id: locals.user!.id, role: locals.user!.role });
		} catch (cause) {
			if (cause instanceof OrderWorkflowError) return fail(400, { error: cause.message });
			throw cause;
		}
	}
};
