import { db } from '$lib/server/db';
import { adminSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const settings = await db.select().from(adminSettings);
	return { settings };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		for (const [key, value] of Object.entries(formData)) {
			await db.update(adminSettings).set({ value: String(value), updatedAt: new Date() })
				.where(eq(adminSettings.key, key));
		}
		return { success: true };
	}
};
