import { db } from '$lib/server/db';
import { customerProfiles, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function isAdult(dateOfBirth: Date, now = new Date()) {
	if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth >= now) return false;
	let age = now.getFullYear() - dateOfBirth.getFullYear();
	const monthDifference = now.getMonth() - dateOfBirth.getMonth();
	if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < dateOfBirth.getDate())) age--;
	return age >= 18;
}

export const load: PageServerLoad = async ({ locals }) => {
	const [profile] = await db.select({ dateOfBirth: customerProfiles.dateOfBirth })
		.from(customerProfiles).where(eq(customerProfiles.userId, locals.user!.id)).limit(1);
	return { dateOfBirth: profile?.dateOfBirth?.toISOString().slice(0, 10) ?? '' };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const rawDate = String(form.get('dateOfBirth') ?? '');
		const confirmed = form.get('confirmAdult') === 'on';
		if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return fail(400, { error: 'Enter a valid date of birth.', dateOfBirth: rawDate });
		const dateOfBirth = new Date(`${rawDate}T00:00:00.000Z`);
		if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.toISOString().slice(0, 10) !== rawDate) {
			return fail(400, { error: 'Enter a valid date of birth.', dateOfBirth: rawDate });
		}
		if (!confirmed) return fail(400, { error: 'Confirm that the date of birth is accurate.', dateOfBirth: rawDate });

		const adult = isAdult(dateOfBirth);
		await db.transaction(async (tx) => {
			await tx.insert(customerProfiles).values({ userId: locals.user!.id, dateOfBirth })
				.onConflictDoUpdate({ target: customerProfiles.userId, set: { dateOfBirth, updatedAt: new Date() } });
			await tx.update(users).set({ ageVerified: adult, updatedAt: new Date() }).where(eq(users.id, locals.user!.id));
		});
		if (!adult) return fail(403, { error: 'You must be at least 18 to order age-restricted products.', dateOfBirth: rawDate });
		return { success: true, dateOfBirth: rawDate };
	}
};
