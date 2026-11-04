import { db } from '$lib/server/db';
import { prescriptions, users, orders } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rxList = await db.select({
		id: prescriptions.id,
		customerId: prescriptions.customerId,
		fileUrl: prescriptions.fileUrl,
		originalFilename: prescriptions.originalFilename,
		mimeType: prescriptions.mimeType,
		status: prescriptions.status,
		pharmacistNotes: prescriptions.pharmacistNotes,
		rejectionReason: prescriptions.rejectionReason,
		createdAt: prescriptions.createdAt,
		verifiedAt: prescriptions.verifiedAt,
		orderId: prescriptions.orderId
	}).from(prescriptions).orderBy(desc(prescriptions.createdAt)).limit(50);

	const customerIds = [...new Set(rxList.map(r => r.customerId))];
	const customerMap: Record<string, string> = {};
	if (customerIds.length > 0) {
		const { sql } = await import('drizzle-orm');
		const customers = await db.select({ id: users.id, fullName: users.fullName, email: users.email })
			.from(users).where(sql`${users.id} = ANY(${customerIds})`);
		customers.forEach(c => customerMap[c.id] = `${c.fullName} (${c.email})`);
	}

	return {
		prescriptions: rxList.map(r => ({
			...r,
			customerName: customerMap[r.customerId] ?? 'Unknown'
		}))
	};
};

export const actions: Actions = {
	verify: async ({ request, locals }) => {
		const data = Object.fromEntries(await request.formData());
		const { prescriptionId, action, notes } = data;
		if (!prescriptionId || !action) return fail(400, { error: 'Missing fields' });

		const newStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'CLARIFICATION_REQUESTED';
		await db.update(prescriptions).set({
			status: newStatus,
			verifiedBy: locals.user!.id,
			verifiedAt: new Date(),
			pharmacistNotes: notes as string || null,
			rejectionReason: action === 'reject' ? (notes as string || 'Rejected by pharmacist') : null,
			updatedAt: new Date()
		}).where(eq(prescriptions.id, prescriptionId as string));

		// If linked to an order, update order status
		const [rx] = await db.select().from(prescriptions).where(eq(prescriptions.id, prescriptionId as string));
		if (rx?.orderId) {
			const orderStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'UNDER_VERIFICATION';
			await db.update(orders).set({ status: orderStatus, updatedAt: new Date() })
				.where(eq(orders.id, rx.orderId));
		}
	}
};
