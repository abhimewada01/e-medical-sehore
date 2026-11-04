import { db } from '$lib/server/db';
import { adminSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

const DEFAULT_SETTINGS = [
	{ key: 'loyalty_enabled', value: 'true', description: 'Enable/disable loyalty rewards system' },
	{ key: 'loyalty_earn_percent', value: '5', description: 'Percentage of order value earned as coins' },
	{ key: 'min_order_for_coins', value: '200', description: 'Minimum order value (₹) to earn coins' },
	{ key: 'max_coins_per_order', value: '100', description: 'Maximum coins that can be earned per order' },
	{ key: 'coin_value_rupees', value: '0.1', description: 'Value of 1 coin in rupees' },
	{ key: 'max_coins_redemption_per_order', value: '50', description: 'Max coins redeemable per order' },
	{ key: 'coins_expiry_days', value: '30', description: 'Days until coins expire after earning' }
];

export const load: PageServerLoad = async () => {
	const existing = await db.select().from(adminSettings);
	const settingsMap: Record<string, string> = {};
	existing.forEach(s => settingsMap[s.key] = s.value);

	// Ensure all defaults exist
	for (const def of DEFAULT_SETTINGS) {
		if (!settingsMap[def.key]) {
			await db.insert(adminSettings).values(def).onConflictDoNothing();
			settingsMap[def.key] = def.value;
		}
	}

	return {
		settings: DEFAULT_SETTINGS.map(d => ({
			...d,
			value: settingsMap[d.key] ?? d.value
		}))
	};
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
