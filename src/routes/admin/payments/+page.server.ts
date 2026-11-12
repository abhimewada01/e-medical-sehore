import { db } from '$lib/server/db';
import { orders, payments, users } from '$lib/server/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db.select({
		id: payments.id, orderId: payments.orderId, amount: payments.amount, currency: payments.currency,
		method: payments.paymentMethod, status: payments.status, paymentReference: payments.razorpayPaymentId,
		createdAt: payments.createdAt, orderNumber: orders.orderNumber, customerId: orders.customerId
	}).from(payments).leftJoin(orders, eq(payments.orderId, orders.id)).orderBy(desc(payments.createdAt)).limit(500);
	const ids = [...new Set(rows.map((row) => row.customerId).filter((id): id is string => !!id))];
	const customers = ids.length ? await db.select({ id: users.id, name: users.fullName }).from(users).where(inArray(users.id, ids)) : [];
	const names = new Map(customers.map((person) => [person.id, person.name]));
	return { payments: rows.map((row) => ({ ...row, customerName: row.customerId ? names.get(row.customerId) ?? 'Customer' : 'Customer' })) };
};
