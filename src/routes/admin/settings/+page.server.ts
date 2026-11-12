import { db } from '$lib/server/db';
import { adminSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const settings = await db.select().from(adminSettings);
	return { settings };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		const numericRanges: Record<string, [number, number]> = {
			loyalty_earn_percent: [0, 100],
			min_order_for_coins: [0, 1_000_000],
			max_coins_per_order: [0, 1_000_000],
			coin_value_rupees: [0.001, 10_000],
			max_coins_redemption_per_order: [0, 1_000_000],
			coins_expiry_days: [1, 3650]
		};
		const updates: Array<{ key: string; value: string }> = [];
		for (const [key, rawValue] of Object.entries(formData)) {
			let value: string;
			if (key === 'loyalty_enabled') {
				if (rawValue !== 'true' && rawValue !== 'false') return fail(400, { error: 'Invalid loyalty setting.' });
				value = String(rawValue);
			} else if (numericRanges[key]) {
				const number = Number(rawValue);
				const [min, max] = numericRanges[key];
				if (!Number.isFinite(number) || number < min || number > max) return fail(400, { error: `Invalid value for ${key}.` });
				value = String(number);
			} else {
				return fail(400, { error: 'Unknown setting.' });
			}
			updates.push({ key, value });
		}
		await db.transaction(async (tx) => {
			for (const { key, value } of updates) {
				await tx.update(adminSettings).set({ value, updatedAt: new Date() }).where(eq(adminSettings.key, key));
			}
		});
		return { success: true };
	}
};
