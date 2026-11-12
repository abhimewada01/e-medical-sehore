import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { orders, payments } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'crypto';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body');
	}
	if (!body || typeof body !== 'object') error(400, 'Invalid payment verification fields');
	const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = body as Record<string, unknown>;

	if (![razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId].every((value) => typeof value === 'string' && value.length > 0)) {
		error(400, 'Missing payment verification fields');
	}
	if (!/^[a-f0-9]{64}$/i.test(razorpaySignature as string)) error(400, 'Invalid payment signature');

	const keySecret = process.env.RAZORPAY_KEY_SECRET;
	if (!keySecret) error(500, 'Payment gateway not configured');

	// Verify signature (CRITICAL – never trust frontend payment data alone)
	const expectedSignature = createHmac('sha256', keySecret)
		.update(`${razorpayOrderId}|${razorpayPaymentId}`)
		.digest('hex');

	const suppliedSignature = Buffer.from(razorpaySignature as string, 'hex');
	const expectedBytes = Buffer.from(expectedSignature, 'hex');
	if (suppliedSignature.length !== expectedBytes.length || !timingSafeEqual(expectedBytes, suppliedSignature)) {
		console.error('Payment signature mismatch', { razorpayOrderId, razorpayPaymentId });
		error(400, 'Invalid payment signature');
	}

	// The signed Razorpay order must be the pending payment for this exact app order.
	const [order] = await db.select().from(orders).where(eq(orders.id, orderId as string));
	if (!order || order.customerId !== locals.user.id) error(404, 'Order not found');
	if (order.paymentMethod !== 'RAZORPAY') error(400, 'Order is not set for Razorpay payment');
	const [payment] = await db.select().from(payments).where(and(
		eq(payments.orderId, order.id),
		eq(payments.razorpayOrderId, razorpayOrderId as string),
		eq(payments.status, 'PENDING')
	)).limit(1);
	if (!payment) error(400, 'Payment does not match this order or is no longer pending');
	if (Number(payment.amount) !== Number(order.grandTotal) || payment.currency !== 'INR') {
		error(400, 'Payment amount does not match this order');
	}

	const recorded = await db.transaction(async (tx) => {
		const [lockedOrder] = await tx.select().from(orders).where(eq(orders.id, order.id)).limit(1).for('update');
		const [lockedPayment] = await tx.select().from(payments).where(and(
			eq(payments.id, payment.id), eq(payments.status, 'PENDING')
		)).limit(1).for('update');
		if (!lockedOrder || !lockedPayment) return false;
		await tx.update(payments).set({
			razorpayPaymentId: razorpayPaymentId as string,
			razorpaySignature: razorpaySignature as string,
			status: 'SUCCESS',
			updatedAt: new Date()
		}).where(eq(payments.id, payment.id));
		await tx.update(orders).set({
			paymentStatus: ['CANCELLED', 'REJECTED'].includes(lockedOrder.status) ? 'REFUND_PENDING' : 'PAID',
			status: lockedOrder.status === 'PENDING' || lockedOrder.status === 'APPROVED' ? 'CONFIRMED' : lockedOrder.status,
			updatedAt: new Date()
		}).where(eq(orders.id, lockedOrder.id));
		return true;
	});
	if (!recorded) error(409, 'Payment was already processed or the order changed. Refresh your order.');

	return json({ success: true });
};
