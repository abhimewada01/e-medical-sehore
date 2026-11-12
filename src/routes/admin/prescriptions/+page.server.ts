import { db } from '$lib/server/db';
import { prescriptions, users, orders, auditLogs } from '$lib/server/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { OrderWorkflowError, releaseOrderReservation } from '$lib/server/services/order-workflow';

export const load: PageServerLoad = async () => {
	const rxList = await db.select({
		id: prescriptions.id,
		customerId: prescriptions.customerId,
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
		if (!['approve', 'reject', 'clarify'].includes(action as string)) return fail(400, { error: 'Invalid review action' });
		const newStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'CLARIFICATION_REQUESTED';
		const cleanNotes = typeof notes === 'string' ? notes.trim().slice(0, 2000) : '';
		try {
			await db.transaction(async (tx) => {
				const [rx] = await tx.select().from(prescriptions).where(eq(prescriptions.id, prescriptionId as string)).limit(1).for('update');
				if (!rx) throw new OrderWorkflowError('Prescription not found');
				if (rx.status !== 'PENDING_VERIFICATION' && rx.status !== 'CLARIFICATION_REQUESTED') throw new OrderWorkflowError('This prescription has already been reviewed');
				const now = new Date();
				await tx.update(prescriptions).set({
					status: newStatus,
					verifiedBy: locals.user!.id,
					verifiedAt: now,
					pharmacistNotes: cleanNotes || null,
					rejectionReason: action === 'reject' ? cleanNotes || 'Rejected by pharmacist' : null,
					updatedAt: now
				}).where(eq(prescriptions.id, rx.id));

				if (rx.orderId && action === 'reject') {
					await releaseOrderReservation(tx, rx.orderId, 'RX_REJECTED', 'REJECTED');
				} else if (rx.orderId && action === 'approve') {
					await tx.update(orders).set({ status: 'APPROVED', updatedAt: now })
						.where(and(eq(orders.id, rx.orderId), eq(orders.status, 'UNDER_VERIFICATION')));
				}
				await tx.insert(auditLogs).values({
					actorId: locals.user!.id,
					actorRole: locals.user!.role,
					action: `PRESCRIPTION_${newStatus}`,
					entityType: 'PRESCRIPTION',
					entityId: rx.id,
					details: { orderId: rx.orderId, notes: cleanNotes || null }
				});
			});
		} catch (cause) {
			if (cause instanceof OrderWorkflowError) return fail(400, { error: cause.message });
			throw cause;
		}
		return { success: true };
	}
};
