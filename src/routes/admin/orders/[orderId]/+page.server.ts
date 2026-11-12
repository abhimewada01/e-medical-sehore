import { db } from '$lib/server/db';
import { orders, orderItems, prescriptions, users, deliveries, inventoryTransactions } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { OrderWorkflowError, transitionAdminOrder } from '$lib/server/services/order-workflow';

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
		const [rx] = await db.select({
			id: prescriptions.id,
			originalFilename: prescriptions.originalFilename,
			status: prescriptions.status,
			pharmacistNotes: prescriptions.pharmacistNotes,
			rejectionReason: prescriptions.rejectionReason
		}).from(prescriptions).where(eq(prescriptions.id, order.prescriptionId)).limit(1);
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
	updateStatus: async ({ request, params, locals }) => {
		const data = Object.fromEntries(await request.formData());
		const status = data.status as string;
		if (!status) return fail(400, { error: 'Missing status' });

		try {
			await transitionAdminOrder(params.orderId, status, { id: locals.user!.id, role: locals.user!.role });
			return { success: true };
		} catch (cause) {
			if (cause instanceof OrderWorkflowError) return fail(400, { error: cause.message });
			throw cause;
		}
	},
	assignDelivery: async ({ request, params, locals }) => {
		const data = Object.fromEntries(await request.formData());
		const agentId = data.agentId as string;
		if (!agentId) return fail(400, { error: 'Missing agent' });

		const [agent] = await db.select({ id: users.id }).from(users).where(and(eq(users.id, agentId), eq(users.role, 'DELIVERY'), eq(users.isActive, true))).limit(1);
		if (!agent) return fail(400, { error: 'Choose an active delivery account.' });
		const [order] = await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, params.orderId)).limit(1);
		if (!order || !['PACKED', 'OUT_FOR_DELIVERY'].includes(order.status)) return fail(400, { error: 'Pack and confirm the order before assigning delivery.' });
		const trackingNum = `TRK-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
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

		await db.update(orders).set({ assignedDeliveryPersonnelId: agentId, updatedAt: new Date() }).where(eq(orders.id, params.orderId));

		return { success: true };
	}
};
