import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { orders, payments } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createHmac } from 'crypto';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = await request.json();

	if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
		error(400, 'Missing payment verification fields');
	}

	const keySecret = process.env.RAZORPAY_KEY_SECRET;
	if (!keySecret) error(500, 'Payment gateway not configured');

	// Verify signature (CRITICAL – never trust frontend payment data alone)
	const expectedSignature = createHmac('sha256', keySecret)
		.update(`${razorpayOrderId}|${razorpayPaymentId}`)
		.digest('hex');

	if (expectedSignature !== razorpaySignature) {
		console.error('Payment signature mismatch', { razorpayOrderId, razorpayPaymentId });
		error(400, 'Invalid payment signature');
	}

	// Verify order belongs to user
	const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
	if (!order || order.customerId !== locals.user.id) error(404, 'Order not found');

	// Mark payment as successful
	await db.update(payments).set({
		razorpayPaymentId,
		razorpaySignature,
		status: 'SUCCESS',
		updatedAt: new Date()
	}).where(eq(payments.razorpayOrderId, razorpayOrderId));

	// Update order payment status
	await db.update(orders).set({
		paymentStatus: 'PAID',
		status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
		updatedAt: new Date()
	}).where(eq(orders.id, orderId));

	return json({ success: true });
};
