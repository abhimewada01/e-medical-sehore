import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { paymentWebhooks, payments, orders } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'crypto';
import type { RequestHandler } from './$types';
import { releaseOrderReservation } from '$lib/server/services/order-workflow';

function validSignature(secret: string, body: string, supplied: string | null) {
	if (!supplied || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
	const expected = createHmac('sha256', secret).update(body).digest();
	const actual = Buffer.from(supplied, 'hex');
	return actual.length === expected.length && timingSafeEqual(expected, actual);
}

export const POST: RequestHandler = async ({ request }) => {
	const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
	if (!webhookSecret) {
		console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
		return new Response('Webhook is not configured', { status: 503 });
	}
	const body = await request.text();
	const signature = request.headers.get('x-razorpay-signature');
	if (!validSignature(webhookSecret, body, signature)) return new Response('Invalid signature', { status: 400 });

	let payload: any;
	try { payload = JSON.parse(body); } catch { return new Response('Invalid JSON', { status: 400 }); }
	const eventId = request.headers.get('x-razorpay-event-id');
	const eventType = payload?.event;
	if (!eventId || !eventType || typeof eventType !== 'string') return new Response('Missing event metadata', { status: 400 });

	try {
		const processed = await db.transaction(async (tx) => {
			const [inserted] = await tx.insert(paymentWebhooks).values({
				eventId,
				eventType,
				payload,
				signature,
				processed: false
			}).onConflictDoNothing().returning({ id: paymentWebhooks.id });
			if (!inserted) return false;

			if (eventType === 'payment.captured' || eventType === 'payment.failed') {
				const entity = payload?.payload?.payment?.entity;
				if (!entity?.order_id || !Number.isInteger(entity.amount) || typeof entity.currency !== 'string') {
					throw new Error('Malformed payment event');
				}
				const [payment] = await tx.select().from(payments)
					.where(eq(payments.razorpayOrderId, entity.order_id)).limit(1).for('update');
				if (payment && payment.status === 'PENDING' && entity.currency === payment.currency && entity.amount === Math.round(Number(payment.amount) * 100)) {
					const success = eventType === 'payment.captured';
					await tx.update(payments).set({
						status: success ? 'SUCCESS' : 'FAILED',
						razorpayPaymentId: entity.id ?? payment.razorpayPaymentId,
						updatedAt: new Date()
					}).where(eq(payments.id, payment.id));
					if (success) {
						const [linkedOrder] = await tx.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1);
						if (linkedOrder && linkedOrder.paymentStatus === 'PENDING') {
							await tx.update(orders).set({
								paymentStatus: ['CANCELLED', 'REJECTED'].includes(linkedOrder.status) ? 'REFUND_PENDING' : 'PAID',
								status: linkedOrder.status === 'PENDING' || linkedOrder.status === 'APPROVED' ? 'CONFIRMED' : linkedOrder.status,
								updatedAt: new Date()
							}).where(eq(orders.id, payment.orderId));
						}
					} else {
						await releaseOrderReservation(tx, payment.orderId, 'PAYMENT_FAILED');
					}
				}
			} else if (eventType === 'refund.created') {
				const entity = payload?.payload?.refund?.entity;
				if (entity?.payment_id) {
					await tx.update(payments).set({
						status: 'REFUNDED',
						refundId: entity.id,
						refundAmount: Number.isInteger(entity.amount) ? String(entity.amount / 100) : null,
						updatedAt: new Date()
					}).where(eq(payments.razorpayPaymentId, entity.payment_id));
				}
			}

			await tx.update(paymentWebhooks).set({ processed: true }).where(eq(paymentWebhooks.id, inserted.id));
			return true;
		});
		return json({ received: true, duplicate: !processed });
	} catch (cause) {
		console.error('Razorpay webhook processing failed:', cause);
		return new Response('Webhook processing failed', { status: 500 });
	}
};
