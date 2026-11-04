import { db } from '$lib/server/db';
import { medicines, medicineCategories } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [med] = await db.select({
		id: medicines.id,
		name: medicines.name,
		genericName: medicines.genericName,
		brandName: medicines.brandName,
		categoryId: medicines.categoryId,
		description: medicines.description,
		dosageForm: medicines.dosageForm,
		strength: medicines.strength,
		packSize: medicines.packSize,
		price: medicines.price,
		discountedPrice: medicines.discountedPrice,
		stockQuantity: medicines.stockQuantity,
		requiresPrescription: medicines.requiresPrescription,
		isAgeRestricted: medicines.isAgeRestricted,
		manufacturer: medicines.manufacturer,
		composition: medicines.composition,
		sideEffects: medicines.sideEffects,
		usageInstructions: medicines.usageInstructions,
		storageInstructions: medicines.storageInstructions,
		imageUrl: medicines.imageUrl,
		isActive: medicines.isActive
	}).from(medicines).where(eq(medicines.id, params.medicineId)).limit(1);

	if (!med || !med.isActive) error(404, 'Medicine not found');

	const [category] = await db.select({ name: medicineCategories.name, slug: medicineCategories.slug })
		.from(medicineCategories).where(eq(medicineCategories.id, med.categoryId)).limit(1);

	return { medicine: med, category: category ?? null };
};
