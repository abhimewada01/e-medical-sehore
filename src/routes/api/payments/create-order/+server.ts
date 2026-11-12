import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { orders, payments } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	let body: unknown;
	try { body = await request.json(); } catch { error(400, 'Invalid JSON body'); }
	const orderId = body && typeof body === 'object' ? (body as Record<string, unknown>).orderId : null;
	if (typeof orderId !== 'string') error(400, 'Missing orderId');

	const [order] = await db.select().from(orders)
		.where(and(eq(orders.id, orderId), eq(orders.customerId, locals.user.id))).limit(1);
	if (!order) error(404, 'Order not found');
	if (order.paymentMethod !== 'RAZORPAY') error(400, 'Order is not set for Razorpay payment');
	if (order.paymentStatus !== 'PENDING' || order.status === 'CANCELLED' || order.status === 'REJECTED') error(400, 'Order cannot be paid');

	const keyId = process.env.RAZORPAY_KEY_ID;
	const keySecret = process.env.RAZORPAY_KEY_SECRET;
	if (!keyId || !keySecret) error(500, 'Payment gateway not configured');

	try {
		const Razorpay = (await import('razorpay')).default;
		const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

		const [existingPayment] = await db.select().from(payments).where(and(
			eq(payments.orderId, order.id), eq(payments.status, 'PENDING')
		)).limit(1);
		if (existingPayment?.razorpayOrderId) {
			return json({ razorpayOrderId: existingPayment.razorpayOrderId, amount: Math.round(Number(order.grandTotal) * 100), currency: 'INR', keyId });
		}
		const rzpOrder = await razorpay.orders.create({
			amount: Math.round(Number(order.grandTotal) * 100), // paise
			currency: 'INR',
			receipt: order.orderNumber,
			notes: { orderId: order.id, customerId: locals.user.id }
		});

		// Record payment initiation
		await db.insert(payments).values({
			orderId: order.id,
			paymentMethod: 'RAZORPAY',
			razorpayOrderId: rzpOrder.id,
			amount: String(order.grandTotal),
			currency: 'INR',
			status: 'PENDING'
		});

		return json({ razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: 'INR', keyId });
	} catch (err: any) {
		console.error('Razorpay order creation failed:', err);
		error(500, 'Failed to create payment order');
	}
};
