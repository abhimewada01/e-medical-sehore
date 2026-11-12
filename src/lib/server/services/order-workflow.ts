import { db } from '$lib/server/db';
import { auditLogs, inventoryTransactions, loyaltyTransactions, loyaltyWallets, medicines, orderItems, orders, prescriptions } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';

type Transaction = Parameters<typeof db.transaction>[0] extends (tx: infer T) => unknown ? T : never;

const transitions: Record<string, string[]> = {
	PENDING: ['CONFIRMED', 'CANCELLED'],
	APPROVED: ['CONFIRMED', 'CANCELLED'],
	CONFIRMED: ['PACKED', 'CANCELLED'],
	PACKED: ['OUT_FOR_DELIVERY', 'PICKED_UP', 'CANCELLED'],
	OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
	PRESCRIPTION_REQUIRED: ['CANCELLED'],
	UNDER_VERIFICATION: ['CANCELLED']
};

export class OrderWorkflowError extends Error {
	constructor(message: string) { super(message); this.name = 'OrderWorkflowError'; }
}

export async function releaseOrderReservation(tx: Transaction, orderId: string, reason: string, finalStatus: 'CANCELLED' | 'REJECTED' = 'CANCELLED') {
	const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1).for('update');
	if (!order) throw new OrderWorkflowError('Order not found');
	if (['CANCELLED', 'REJECTED', 'DELIVERED', 'PICKED_UP', 'REFUNDED'].includes(order.status)) return order;

	const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
	for (const item of items) {
		const [medicine] = await tx.update(medicines)
			.set({ stockQuantity: sql`${medicines.stockQuantity} + ${item.quantity}`, updatedAt: new Date() })
			.where(eq(medicines.id, item.medicineId))
			.returning({ stockQuantity: medicines.stockQuantity });
		if (medicine) {
			await tx.insert(inventoryTransactions).values({
				medicineId: item.medicineId,
				type: 'ORDER_CANCELLED_RESTORE',
				quantityChange: item.quantity,
				previousQuantity: medicine.stockQuantity - item.quantity,
				newQuantity: medicine.stockQuantity,
				referenceType: 'ORDER',
				referenceId: order.orderNumber,
				notes: `Stock restored because ${reason}`
			});
		}
	}

	if (order.loyaltyCoinsRedeemed > 0) {
		const [wallet] = await tx.select().from(loyaltyWallets).where(eq(loyaltyWallets.userId, order.customerId)).limit(1).for('update');
		if (wallet) {
			const nextBalance = wallet.balanceCoins + order.loyaltyCoinsRedeemed;
			await tx.update(loyaltyWallets).set({
				balanceCoins: nextBalance,
				totalRedeemedCoins: Math.max(0, wallet.totalRedeemedCoins - order.loyaltyCoinsRedeemed),
				updatedAt: new Date()
			}).where(eq(loyaltyWallets.id, wallet.id));
			await tx.insert(loyaltyTransactions).values({
				walletId: wallet.id,
				type: 'REVERSAL_REFUND',
				coins: order.loyaltyCoinsRedeemed,
				previousBalance: wallet.balanceCoins,
				newBalance: nextBalance,
				referenceNote: `Restored coins for ${order.orderNumber}: ${reason}`
			});
		}
	}

	const paymentStatus = order.paymentStatus === 'PAID'
		? 'REFUND_PENDING'
		: reason === 'PAYMENT_FAILED' ? 'FAILED' : order.paymentStatus;
	await tx.update(orders).set({ status: finalStatus, paymentStatus, cancelledAt: new Date(), updatedAt: new Date() }).where(eq(orders.id, order.id));
	return { ...order, status: finalStatus, paymentStatus };
}

export async function transitionAdminOrder(orderId: string, newStatus: string, actor: { id: string; role: string }) {
	return db.transaction(async (tx) => {
		const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1).for('update');
		if (!order) throw new OrderWorkflowError('Order not found');
		if (newStatus === 'CANCELLED') {
			if (!transitions[order.status]?.includes('CANCELLED')) throw new OrderWorkflowError(`An order in ${order.status} cannot be cancelled`);
			const cancelled = await releaseOrderReservation(tx, order.id, 'ADMIN_CANCEL');
			await tx.insert(auditLogs).values({ actorId: actor.id, actorRole: actor.role, action: 'ORDER_CANCELLED', entityType: 'ORDER', entityId: order.id, details: { previousStatus: order.status } });
			return cancelled;
		}
		if (!transitions[order.status]?.includes(newStatus)) throw new OrderWorkflowError(`Cannot move an order from ${order.status} to ${newStatus}`);
		if (newStatus === 'CONFIRMED' || newStatus === 'PACKED' || newStatus === 'OUT_FOR_DELIVERY' || newStatus === 'DELIVERED' || newStatus === 'PICKED_UP') {
			if (order.paymentMethod === 'RAZORPAY' && order.paymentStatus !== 'PAID') throw new OrderWorkflowError('Razorpay payment must be confirmed before fulfillment');
			const rxItems = await tx.select({ id: orderItems.id }).from(orderItems)
				.where(and(eq(orderItems.orderId, order.id), eq(orderItems.requiresPrescription, true))).limit(1);
			if (rxItems.length) {
				if (!order.prescriptionId) throw new OrderWorkflowError('A pharmacist-approved prescription is required');
				const [rx] = await tx.select({ status: prescriptions.status }).from(prescriptions).where(eq(prescriptions.id, order.prescriptionId)).limit(1);
				if (rx?.status !== 'APPROVED') throw new OrderWorkflowError('A pharmacist must approve the prescription before fulfillment');
			}
		}

		const now = new Date();
		const update: Record<string, unknown> = { status: newStatus, updatedAt: now };
		if (newStatus === 'DELIVERED' || newStatus === 'PICKED_UP') update.deliveredAt = now;
		await tx.update(orders).set(update).where(eq(orders.id, order.id));
		await tx.insert(auditLogs).values({ actorId: actor.id, actorRole: actor.role, action: 'ORDER_STATUS_CHANGED', entityType: 'ORDER', entityId: order.id, details: { from: order.status, to: newStatus } });
		return { ...order, status: newStatus };
	});
}
