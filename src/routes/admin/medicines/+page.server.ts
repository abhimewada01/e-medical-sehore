import { db } from '$lib/server/db';
import { medicines, medicineCategories } from '$lib/server/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const filter = url.searchParams.get('filter') ?? '';
	const q = url.searchParams.get('q') ?? '';

	const conditions: any[] = [];
	if (filter === 'low_stock') conditions.push(sql`${medicines.stockQuantity} <= ${medicines.minStockAlert}`);
	if (q) conditions.push(sql`${medicines.name} ilike ${`%${q}%`}`);

	const [medList, categories] = await Promise.all([
		db.select({
			id: medicines.id,
			name: medicines.name,
			dosageForm: medicines.dosageForm,
			strength: medicines.strength,
			price: medicines.price,
			discountedPrice: medicines.discountedPrice,
			stockQuantity: medicines.stockQuantity,
			minStockAlert: medicines.minStockAlert,
			requiresPrescription: medicines.requiresPrescription,
			isActive: medicines.isActive,
			manufacturer: medicines.manufacturer,
			categoryId: medicines.categoryId,
			imageUrl: medicines.imageUrl
		}).from(medicines)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(medicines.createdAt)),
		db.select().from(medicineCategories).where(eq(medicineCategories.isActive, true))
	]);

	return { medicines: medList, categories, filter, q };
};

export const actions: Actions = {
	toggleActive: async ({ request }) => {
		const data = Object.fromEntries(await request.formData());
		const id = data.id as string;
		if (!id) return fail(400, { error: 'Missing id' });
		const [med] = await db.select({ isActive: medicines.isActive }).from(medicines).where(eq(medicines.id, id));
		if (!med) return fail(404, { error: 'Not found' });
		await db.update(medicines).set({ isActive: !med.isActive, updatedAt: new Date() }).where(eq(medicines.id, id));
	},
	updateStock: async ({ request }) => {
		const data = Object.fromEntries(await request.formData());
		const id = data.id as string;
		const qty = parseInt(data.qty as string);
		if (!id || isNaN(qty) || qty < 0) return fail(400, { error: 'Invalid input' });
		await db.update(medicines).set({ stockQuantity: qty, updatedAt: new Date() }).where(eq(medicines.id, id));
	}
};
