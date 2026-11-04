import { db } from '$lib/server/db';
import { medicines, medicineCategories } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { medicineSchema } from '$lib/server/validation/medicine';
import { saveMedicineImage } from '$lib/server/services/medicine-images';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const categories = await db.select().from(medicineCategories).where(eq(medicineCategories.isActive, true));
	return { categories };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const submitted = await request.formData();
		const values = Object.fromEntries([...submitted.entries()].filter(([, value]) => typeof value === 'string'));
		const result = medicineSchema.safeParse(values);
		if (!result.success) {
			return fail(400, { errors: result.error.flatten().fieldErrors, values });
		}

		const { price, discountedPrice, ...rest } = result.data;
		if (discountedPrice > price) {
			return fail(400, { error: 'Discounted price cannot exceed MRP', values });
		}

		let imageUrl: string | null = null;
		const imageFile = submitted.get('image');
		if (imageFile instanceof File && imageFile.size > 0) {
			const upload = await saveMedicineImage(imageFile);
			if ('error' in upload) return fail(400, { error: upload.error, values });
			imageUrl = upload.url;
		}

		await db.insert(medicines).values({
			name: rest.name,
			genericName: rest.genericName || null,
			brandName: rest.brandName || null,
			categoryId: rest.categoryId,
			description: rest.description || null,
			dosageForm: rest.dosageForm,
			strength: rest.strength || null,
			packSize: rest.packSize || null,
			manufacturer: rest.manufacturer || null,
			composition: rest.composition || null,
			sideEffects: rest.sideEffects || null,
			usageInstructions: rest.usageInstructions || null,
			storageInstructions: rest.storageInstructions || null,
			stockQuantity: rest.stockQuantity,
			minStockAlert: rest.minStockAlert,
			requiresPrescription: rest.requiresPrescription,
			isAgeRestricted: rest.isAgeRestricted,
			imageUrl,
			price: String(price.toFixed(2)),
			discountedPrice: String(discountedPrice.toFixed(2)),
			isActive: true
		});

		redirect(302, '/admin/medicines');
	}
};
