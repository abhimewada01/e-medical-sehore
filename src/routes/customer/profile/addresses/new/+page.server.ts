import { db } from '$lib/server/db';
import { customerAddresses } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const addressSchema = z.object({
	recipientName: z.string().min(2).max(100),
	phone: z.string().min(10).max(15),
	addressLine1: z.string().min(5),
	addressLine2: z.string().optional().or(z.literal('')),
	landmark: z.string().optional().or(z.literal('')),
	city: z.string().min(2).default('Sehore'),
	state: z.string().min(2).default('Madhya Pradesh'),
	postalCode: z.string().min(6).max(6).default('466001'),
	isDefault: z.coerce.boolean().default(false)
});

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/auth/login');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/auth/login');
		const formData = Object.fromEntries(await request.formData());
		const result = addressSchema.safeParse(formData);
		if (!result.success) {
			return fail(400, { errors: result.error.flatten().fieldErrors, values: formData });
		}

		await db.insert(customerAddresses).values({
			userId: locals.user.id,
			recipientName: result.data.recipientName,
			phone: result.data.phone,
			addressLine1: result.data.addressLine1,
			addressLine2: result.data.addressLine2 || null,
			landmark: result.data.landmark || null,
			city: result.data.city,
			state: result.data.state,
			postalCode: result.data.postalCode,
			isDefault: result.data.isDefault
		});

		redirect(302, '/checkout');
	}
};
