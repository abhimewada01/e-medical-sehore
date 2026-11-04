import { db } from '$lib/server/db';
import { doctors, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'DOCTOR') redirect(302, '/auth/login');

	const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, locals.user.id)).limit(1);
	return { doctor, user: locals.user };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/auth/login');

		const formData = Object.fromEntries(await request.formData());
		const schema = z.object({
			fullName: z.string().min(2).max(100),
			phone: z.string().min(10).max(15),
			qualification: z.string().min(2),
			specialization: z.string().min(2),
			clinicName: z.string().min(2),
			clinicAddress: z.string().min(5),
			bio: z.string().optional().or(z.literal(''))
		});

		const result = schema.safeParse(formData);
		if (!result.success) {
			return fail(400, { errors: result.error.flatten().fieldErrors });
		}

		await db.update(users).set({
			fullName: result.data.fullName,
			phone: result.data.phone,
			updatedAt: new Date()
		}).where(eq(users.id, locals.user.id));

		await db.update(doctors).set({
			qualification: result.data.qualification,
			specialization: result.data.specialization,
			clinicName: result.data.clinicName,
			clinicAddress: result.data.clinicAddress,
			phone: result.data.phone,
			bio: result.data.bio || null,
			updatedAt: new Date()
		}).where(eq(doctors.userId, locals.user.id));

		return { success: true };
	}
};
