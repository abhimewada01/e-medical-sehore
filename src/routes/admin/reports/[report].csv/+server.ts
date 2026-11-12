import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { medicines, medicineCategories, orders, payments, users } from '$lib/server/db/schema';
import { asc, desc, eq } from 'drizzle-orm';

const cell = (value: unknown) => {
	let raw = value == null ? '' : value instanceof Date ? value.toISOString() : String(value);
	if (/^[=+\-@\t\r]/.test(raw)) raw = `'${raw}`;
	return `"${raw.replace(/"/g, '""')}"`;
};
const csv = (rows: unknown[][]) => rows.map((row) => row.map(cell).join(',')).join('\r\n');

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || !['SUPER_ADMIN', 'PHARMACY_ADMIN', 'PHARMACIST'].includes(locals.user.role)) error(403, 'Admin access required');
	if (params.report === 'users' && !['SUPER_ADMIN', 'PHARMACY_ADMIN'].includes(locals.user.role)) error(403, 'User report access required');
	let filename = params.report;
	let body: string;
	switch (params.report) {
		case 'orders': {
			const rows = await db.select({ number: orders.orderNumber, customer: users.fullName, email: users.email, status: orders.status, paymentStatus: orders.paymentStatus, method: orders.paymentMethod, total: orders.grandTotal, fulfillment: orders.fulfillmentType, created: orders.createdAt }).from(orders).leftJoin(users, eq(orders.customerId, users.id)).orderBy(desc(orders.createdAt)).limit(5000);
			body = csv([['Order','Customer','Email','Status','Payment status','Method','Total INR','Fulfillment','Created'], ...rows.map((r) => [r.number,r.customer,r.email,r.status,r.paymentStatus,r.method,r.total,r.fulfillment,r.created])]); break;
		}
		case 'payments': {
			const rows = await db.select({ order: orders.orderNumber, customer: users.fullName, method: payments.paymentMethod, amount: payments.amount, currency: payments.currency, status: payments.status, reference: payments.razorpayPaymentId, created: payments.createdAt }).from(payments).leftJoin(orders, eq(payments.orderId, orders.id)).leftJoin(users, eq(orders.customerId, users.id)).orderBy(desc(payments.createdAt)).limit(5000);
			body = csv([['Order','Customer','Method','Amount','Currency','Status','Payment reference','Created'], ...rows.map((r) => [r.order,r.customer,r.method,r.amount,r.currency,r.status,r.reference,r.created])]); break;
		}
		case 'users': {
			const rows = await db.select({ name: users.fullName, email: users.email, phone: users.phone, role: users.role, active: users.isActive, created: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(5000);
			body = csv([['Name','Email','Phone','Role','Active','Joined'], ...rows.map((r) => [r.name,r.email,r.phone,r.role,r.active,r.created])]); break;
		}
		case 'inventory': {
			const rows = await db.select({ name: medicines.name, category: medicineCategories.name, price: medicines.price, discounted: medicines.discountedPrice, stock: medicines.stockQuantity, active: medicines.isActive, image: medicines.imageUrl }).from(medicines).leftJoin(medicineCategories, eq(medicines.categoryId, medicineCategories.id)).orderBy(asc(medicines.name)).limit(5000);
			body = csv([['Medicine','Category','MRP INR','Sale price INR','Stock quantity','Active','Image URL'], ...rows.map((r) => [r.name,r.category,r.price,r.discounted,r.stock,r.active,r.image])]); break;
		}
		default: error(404, 'Report not found');
	}
	return new Response(`\uFEFF${body}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } });
};
