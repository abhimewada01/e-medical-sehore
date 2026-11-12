import { db } from '$lib/server/db';
import { medicines, medicineCategories } from '$lib/server/db/schema';
import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	items: await db.select({
		id: medicines.id, name: medicines.name, imageUrl: medicines.imageUrl,
		isActive: medicines.isActive, categoryName: medicineCategories.name
	}).from(medicines).leftJoin(medicineCategories, eq(medicines.categoryId, medicineCategories.id))
		.orderBy(asc(medicines.name)).limit(300)
});
