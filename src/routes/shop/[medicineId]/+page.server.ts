import { db } from '$lib/server/db';
import { medicines, medicineCategories } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { _FALLBACK_MEDICINES } from '../+page.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const fallbackMed = _FALLBACK_MEDICINES.find((item) => item.id === params.medicineId);
	if (fallbackMed) {
		const category = ['f3', 'f5', 'f8'].includes(fallbackMed.id)
			? { name: 'Vitamins & Supplements', slug: 'vitamins' }
			: { name: 'Tablets & Capsules', slug: 'tablets' };
		return {
			medicine: {
				...fallbackMed,
				categoryId: '',
				description: null,
				composition: null,
				sideEffects: null,
				usageInstructions: null,
				storageInstructions: null,
				isAgeRestricted: false
			},
			category
		};
	}

	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.medicineId)) {
		error(404, 'Medicine not found');
	}

	let med;
	try {
		[med] = await db.select({
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
	} catch (cause) {
		console.error('Medicine details could not be loaded:', cause);
		error(503, 'Medicine details are temporarily unavailable');
	}

	if (!med || !med.isActive) error(404, 'Medicine not found');

	let category = null;
	try {
		[category] = await db.select({ name: medicineCategories.name, slug: medicineCategories.slug })
			.from(medicineCategories).where(eq(medicineCategories.id, med.categoryId)).limit(1);
	} catch (cause) {
		console.warn('Medicine category could not be loaded:', cause);
	}

	return { medicine: med, category: category ?? null };
};
