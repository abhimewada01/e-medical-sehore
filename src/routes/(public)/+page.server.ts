import { db } from '$lib/server/db';
import { medicines, medicineCategories } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const FALLBACK_CATEGORIES = [
	{ id: '1', slug: 'tablets', name: 'Tablets & Capsules', iconName: 'Pill', sortOrder: 1, isAgeRestricted: false, isActive: true, description: null, createdAt: new Date() },
	{ id: '2', slug: 'syrups', name: 'Syrups & Liquids', iconName: 'Beaker', sortOrder: 2, isAgeRestricted: false, isActive: true, description: null, createdAt: new Date() },
	{ id: '3', slug: 'vitamins', name: 'Vitamins & Supplements', iconName: 'Leaf', sortOrder: 3, isAgeRestricted: false, isActive: true, description: null, createdAt: new Date() },
	{ id: '4', slug: 'skincare', name: 'Skincare', iconName: 'Sparkles', sortOrder: 4, isAgeRestricted: false, isActive: true, description: null, createdAt: new Date() },
	{ id: '5', slug: 'baby-care', name: 'Baby Care', iconName: 'Baby', sortOrder: 5, isAgeRestricted: false, isActive: true, description: null, createdAt: new Date() },
	{ id: '6', slug: 'devices', name: 'Devices & Equipment', iconName: 'Stethoscope', sortOrder: 6, isAgeRestricted: false, isActive: true, description: null, createdAt: new Date() },
	{ id: '7', slug: 'wellness', name: 'Wellness', iconName: 'Heart', sortOrder: 7, isAgeRestricted: false, isActive: true, description: null, createdAt: new Date() }
];

const FALLBACK_MEDICINES = [
	{ id: 'f1', name: 'Paracetamol 500mg', brandName: 'Dolo 650', price: '25.00', discountedPrice: '20.00', imageUrl: null, requiresPrescription: false, dosageForm: 'Tablet', strength: '500mg', stockQuantity: 250 },
	{ id: 'f2', name: 'Amoxicillin 500mg', brandName: 'Mox 500', price: '95.00', discountedPrice: '85.00', imageUrl: null, requiresPrescription: true, dosageForm: 'Capsule', strength: '500mg', stockQuantity: 120 },
	{ id: 'f3', name: 'Vitamin C 500mg Chewable', brandName: 'Limcee', price: '120.00', discountedPrice: '99.00', imageUrl: null, requiresPrescription: false, dosageForm: 'Tablet', strength: '500mg', stockQuantity: 300 },
	{ id: 'f4', name: 'Cetirizine 10mg', brandName: 'Zyrtec', price: '35.00', discountedPrice: '28.00', imageUrl: null, requiresPrescription: false, dosageForm: 'Tablet', strength: '10mg', stockQuantity: 150 },
	{ id: 'f5', name: 'Vitamin D3 60,000 IU', brandName: 'D-Rise 60K', price: '180.00', discountedPrice: '155.00', imageUrl: null, requiresPrescription: false, dosageForm: 'Capsule', strength: '60000 IU', stockQuantity: 180 },
	{ id: 'f6', name: 'Omeprazole 20mg', brandName: 'Omez 20', price: '45.00', discountedPrice: '38.00', imageUrl: null, requiresPrescription: false, dosageForm: 'Capsule', strength: '20mg', stockQuantity: 220 },
	{ id: 'f7', name: 'Azithromycin 500mg', brandName: 'Azithral 500', price: '130.00', discountedPrice: '115.00', imageUrl: null, requiresPrescription: true, dosageForm: 'Tablet', strength: '500mg', stockQuantity: 90 },
	{ id: 'f8', name: 'Multivitamin Complex + Zinc', brandName: 'Becadexamin', price: '60.00', discountedPrice: '52.00', imageUrl: null, requiresPrescription: false, dosageForm: 'Capsule', strength: 'Daily', stockQuantity: 350 }
];

export const load: PageServerLoad = async () => {
	try {
		const [categories, featuredMedicines] = await Promise.all([
			db.select().from(medicineCategories).where(eq(medicineCategories.isActive, true)).orderBy(medicineCategories.sortOrder),
			db.select({
				id: medicines.id,
				name: medicines.name,
				brandName: medicines.brandName,
				price: medicines.price,
				discountedPrice: medicines.discountedPrice,
				imageUrl: medicines.imageUrl,
				requiresPrescription: medicines.requiresPrescription,
				dosageForm: medicines.dosageForm,
				strength: medicines.strength,
				stockQuantity: medicines.stockQuantity
			}).from(medicines)
				.where(and(eq(medicines.isActive, true)))
				.orderBy(desc(medicines.createdAt))
				.limit(8)
		]);

		return {
			categories: categories.length > 0 ? categories : FALLBACK_CATEGORIES,
			featuredMedicines: featuredMedicines.length > 0 ? featuredMedicines : FALLBACK_MEDICINES,
			dbConnected: true
		};
	} catch (err) {
		console.warn('Database query failed in index load, serving fallback data:', err);
		return {
			categories: FALLBACK_CATEGORIES,
			featuredMedicines: FALLBACK_MEDICINES,
			dbConnected: false
		};
	}
};
