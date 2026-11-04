import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { orders, payments } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const { orderId } = await request.json();
	if (!orderId) error(400, 'Missing orderId');

	const [order] = await db.select().from(orders)
		.where(eq(orders.id, orderId));
	if (!order || order.customerId !== locals.user.id) error(404, 'Order not found');
	if (order.paymentMethod !== 'RAZORPAY') error(400, 'Order is not set for Razorpay payment');

	const keyId = process.env.RAZORPAY_KEY_ID;
	const keySecret = process.env.RAZORPAY_KEY_SECRET;
	if (!keyId || !keySecret) error(500, 'Payment gateway not configured');

	try {
		const Razorpay = (await import('razorpay')).default;
		const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

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
		}).onConflictDoNothing();

		return json({ razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: 'INR', keyId });
	} catch (err: any) {
		console.error('Razorpay order creation failed:', err);
		error(500, 'Failed to create payment order');
	}
};
