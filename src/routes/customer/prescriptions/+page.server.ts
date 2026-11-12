import { db } from '$lib/server/db';
import { prescriptions, users, notifications } from '$lib/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { savePrescriptionFile } from '$lib/server/services/prescriptions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const rxList = await db.select({
		id: prescriptions.id,
		originalFilename: prescriptions.originalFilename,
		status: prescriptions.status,
		createdAt: prescriptions.createdAt,
		pharmacistNotes: prescriptions.pharmacistNotes,
		rejectionReason: prescriptions.rejectionReason,
		orderId: prescriptions.orderId
	}).from(prescriptions)
		.where(eq(prescriptions.customerId, userId))
		.orderBy(desc(prescriptions.createdAt));
	return { prescriptions: rxList };
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const formData = await request.formData();
		const file = formData.get('prescription');
		if (!(file instanceof File)) return fail(400, { error: 'Please select a file to upload' });

		const saved = await savePrescriptionFile(file, locals.user!.id);
		if ('error' in saved) return fail(400, { error: saved.error });

		try {
			const pharmacyStaff = await db.select({ id: users.id }).from(users)
				.where(inArray(users.role, ['SUPER_ADMIN', 'PHARMACY_ADMIN', 'PHARMACIST']));
			if (pharmacyStaff.length > 0) {
				await db.insert(notifications).values(pharmacyStaff.map((staff) => ({
					userId: staff.id,
					title: 'New prescription to review',
					message: `${locals.user!.fullName} uploaded a prescription for pharmacist review.`,
					type: 'PRESCRIPTION',
					link: '/admin/prescriptions'
				})));
			}
		} catch (cause) {
			console.warn('Could not notify pharmacy staff about the new prescription:', cause);
		}

		return { success: true, prescriptionId: saved.prescriptionId };
	}
};
