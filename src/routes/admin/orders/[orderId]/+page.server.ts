import { db } from '$lib/server/db';
import { orders, orderItems, prescriptions, users, deliveries, inventoryTransactions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [order] = await db.select().from(orders).where(eq(orders.id, params.orderId)).limit(1);
	if (!order) error(404, 'Order not found');

	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
	const [customer] = await db.select({
		id: users.id,
		fullName: users.fullName,
		email: users.email,
		phone: users.phone
	}).from(users).where(eq(users.id, order.customerId)).limit(1);

	let prescription = null;
	if (order.prescriptionId) {
		const [rx] = await db.select().from(prescriptions).where(eq(prescriptions.id, order.prescriptionId)).limit(1);
		prescription = rx ?? null;
	}

	const [delivery] = await db.select().from(deliveries).where(eq(deliveries.orderId, order.id)).limit(1);
	const deliveryAgents = await db.select({
		id: users.id,
		fullName: users.fullName,
		phone: users.phone
	}).from(users).where(eq(users.role, 'DELIVERY'));

	return {
		order,
		items,
		customer,
		prescription,
		delivery: delivery ?? null,
		deliveryAgents
	};
};

export const actions: Actions = {
	updateStatus: async ({ request, params }) => {
		const data = Object.fromEntries(await request.formData());
		const status = data.status as string;
		if (!status) return fail(400, { error: 'Missing status' });

		const updates: any = { status, updatedAt: new Date() };
		if (status === 'DELIVERED' || status === 'PICKED_UP') updates.deliveredAt = new Date();
		if (status === 'CANCELLED') updates.cancelledAt = new Date();

		await db.update(orders).set(updates).where(eq(orders.id, params.orderId));
		return { success: true };
	},
	assignDelivery: async ({ request, params }) => {
		const data = Object.fromEntries(await request.formData());
		const agentId = data.agentId as string;
		if (!agentId) return fail(400, { error: 'Missing agent' });

		const trackingNum = `TRK-${Date.now().toString(36).toUpperCase()}`;
		await db.insert(deliveries).values({
			orderId: params.orderId,
			deliveryAgentId: agentId,
			trackingNumber: trackingNum,
			status: 'ASSIGNED',
			estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000)
		}).onConflictDoUpdate({
			target: deliveries.orderId,
			set: { deliveryAgentId: agentId, updatedAt: new Date() }
		});

		await db.update(orders).set({
			assignedDeliveryPersonnelId: agentId,
			status: 'OUT_FOR_DELIVERY',
			updatedAt: new Date()
		}).where(eq(orders.id, params.orderId));

		return { success: true };
	}
};
