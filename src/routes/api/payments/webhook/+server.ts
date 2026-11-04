import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { paymentWebhooks, payments, orders } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createHmac } from 'crypto';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
	const signature = request.headers.get('x-razorpay-signature');
	const body = await request.text();

	if (webhookSecret && signature) {
		const expectedSig = createHmac('sha256', webhookSecret).update(body).digest('hex');
		if (expectedSig !== signature) {
			return new Response('Invalid signature', { status: 400 });
		}
	}

	const payload = JSON.parse(body);
	const eventId = payload.payload?.payment?.entity?.id ?? null;
	const eventType = payload.event;

	// Idempotent: skip if already processed
	const existing = await db.select().from(paymentWebhooks)
		.where(eq(paymentWebhooks.eventId, eventId ?? '')).limit(1);
	if (existing.length && existing[0].processed) {
		return json({ received: true });
	}

	// Store webhook
	await db.insert(paymentWebhooks).values({
		eventId,
		eventType,
		payload,
		signature,
		processed: false
	}).onConflictDoNothing();

	// Handle payment events
	if (eventType === 'payment.captured') {
		const entity = payload.payload.payment.entity;
		const rzpOrderId = entity.order_id;

		if (rzpOrderId) {
			await db.update(payments).set({ status: 'SUCCESS', updatedAt: new Date() })
				.where(eq(payments.razorpayOrderId, rzpOrderId));
			const [payment] = await db.select().from(payments).where(eq(payments.razorpayOrderId, rzpOrderId));
			if (payment) {
				await db.update(orders).set({ paymentStatus: 'PAID', updatedAt: new Date() })
					.where(eq(orders.id, payment.orderId));
			}
		}
	} else if (eventType === 'payment.failed') {
		const entity = payload.payload.payment.entity;
		const rzpOrderId = entity.order_id;
		if (rzpOrderId) {
			await db.update(payments).set({ status: 'FAILED', updatedAt: new Date() })
				.where(eq(payments.razorpayOrderId, rzpOrderId));
		}
	} else if (eventType === 'refund.created') {
		const entity = payload.payload.refund.entity;
		const paymentId = entity.payment_id;
		if (paymentId) {
			await db.update(payments).set({
				status: 'REFUNDED',
				refundId: entity.id,
				refundAmount: String(entity.amount / 100),
				updatedAt: new Date()
			}).where(eq(payments.razorpayPaymentId, paymentId));
		}
	}

	// Mark processed
	if (eventId) {
		await db.update(paymentWebhooks).set({ processed: true })
			.where(eq(paymentWebhooks.eventId, eventId));
	}

	return json({ received: true });
};
