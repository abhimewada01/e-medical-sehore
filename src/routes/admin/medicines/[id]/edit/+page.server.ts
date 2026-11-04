import { db } from '$lib/server/db';
import { medicines, medicineCategories } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { medicineSchema } from '$lib/server/validation/medicine';
import { adjustInventory } from '$lib/server/services/inventory';
import { saveMedicineImage } from '$lib/server/services/medicine-images';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [medicine] = await db.select().from(medicines).where(eq(medicines.id, params.id)).limit(1);
	if (!medicine) error(404, 'Medicine not found');
	const categories = await db
		.select()
		.from(medicineCategories)
		.where(eq(medicineCategories.isActive, true));
	return { medicine, categories };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const submitted = await request.formData();
		const values = Object.fromEntries([...submitted.entries()].filter(([, value]) => typeof value === 'string'));
		const result = medicineSchema.safeParse(values);
		if (!result.success) {
			return fail(400, { errors: result.error.flatten().fieldErrors, values });
		}

		const [existing] = await db.select().from(medicines).where(eq(medicines.id, params.id)).limit(1);
		if (!existing) error(404, 'Medicine not found');

		const { price, discountedPrice, stockQuantity, ...rest } = result.data;
		if (discountedPrice > price) {
			return fail(400, { error: 'Discounted price cannot exceed MRP', values });
		}

		let imageUrl = existing.imageUrl;
		const imageFile = submitted.get('image');
		if (imageFile instanceof File && imageFile.size > 0) {
			const upload = await saveMedicineImage(imageFile);
			if ('error' in upload) return fail(400, { error: upload.error, values });
			imageUrl = upload.url;
		}

		if (stockQuantity !== existing.stockQuantity) {
			const delta = stockQuantity - existing.stockQuantity;
			await adjustInventory(
				existing.id,
				delta,
				delta > 0 ? 'RESTOCK' : 'AUDIT_ADJUSTMENT',
				existing.id,
				`Admin stock update: ${existing.stockQuantity} → ${stockQuantity}`,
				locals.user?.id
			);
		}

		await db
			.update(medicines)
			.set({
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
				minStockAlert: rest.minStockAlert,
				requiresPrescription: rest.requiresPrescription,
				isAgeRestricted: rest.isAgeRestricted,
				imageUrl,
				price: String(price.toFixed(2)),
				discountedPrice: String(discountedPrice.toFixed(2)),
				updatedAt: new Date()
			})
			.where(eq(medicines.id, params.id));

		redirect(302, '/admin/medicines');
	}
};
