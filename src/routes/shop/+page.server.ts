import { db } from '$lib/server/db';
import { medicines, medicineCategories } from '$lib/server/db/schema';
import { eq, desc, ilike, and, asc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

const FALLBACK_CATEGORIES = [
	{ id: '1', slug: 'tablets', name: 'Tablets & Capsules' },
	{ id: '2', slug: 'syrups', name: 'Syrups & Liquids' },
	{ id: '3', slug: 'vitamins', name: 'Vitamins & Supplements' },
	{ id: '4', slug: 'skincare', name: 'Skincare' },
	{ id: '5', slug: 'baby-care', name: 'Baby Care' },
	{ id: '6', slug: 'devices', name: 'Devices & Equipment' },
	{ id: '7', slug: 'wellness', name: 'Wellness' }
];

const FALLBACK_MEDICINES = [
	{ id: 'f1', name: 'Paracetamol 500mg', genericName: 'Paracetamol', brandName: 'Dolo 650', dosageForm: 'Tablet', strength: '500mg', packSize: '10 Tablets / Strip', price: '25.00', discountedPrice: '20.00', stockQuantity: 250, requiresPrescription: false, isAgeRestricted: false, imageUrl: null, manufacturer: 'Micro Labs' },
	{ id: 'f2', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', brandName: 'Mox 500', dosageForm: 'Capsule', strength: '500mg', packSize: '10 Capsules / Strip', price: '95.00', discountedPrice: '85.00', stockQuantity: 120, requiresPrescription: true, isAgeRestricted: false, imageUrl: null, manufacturer: 'Ranbaxy' },
	{ id: 'f3', name: 'Vitamin C 500mg Chewable', genericName: 'Ascorbic Acid', brandName: 'Limcee', dosageForm: 'Tablet', strength: '500mg', packSize: '30 Tablets / Bottle', price: '120.00', discountedPrice: '99.00', stockQuantity: 300, requiresPrescription: false, isAgeRestricted: false, imageUrl: null, manufacturer: 'Abbott India' },
	{ id: 'f4', name: 'Cetirizine 10mg', genericName: 'Cetirizine', brandName: 'Zyrtec', dosageForm: 'Tablet', strength: '10mg', packSize: '10 Tablets / Strip', price: '35.00', discountedPrice: '28.00', stockQuantity: 150, requiresPrescription: false, isAgeRestricted: false, imageUrl: null, manufacturer: 'GSK' },
	{ id: 'f5', name: 'Vitamin D3 60,000 IU', genericName: 'Cholecalciferol', brandName: 'D-Rise 60K', dosageForm: 'Capsule', strength: '60000 IU', packSize: '4 Capsules / Pack', price: '180.00', discountedPrice: '155.00', stockQuantity: 180, requiresPrescription: false, isAgeRestricted: false, imageUrl: null, manufacturer: 'USV Ltd' },
	{ id: 'f6', name: 'Omeprazole 20mg', genericName: 'Omeprazole', brandName: 'Omez 20', dosageForm: 'Capsule', strength: '20mg', packSize: '10 Capsules / Strip', price: '45.00', discountedPrice: '38.00', stockQuantity: 220, requiresPrescription: false, isAgeRestricted: false, imageUrl: null, manufacturer: 'Dr. Reddys' },
	{ id: 'f7', name: 'Azithromycin 500mg', genericName: 'Azithromycin', brandName: 'Azithral 500', dosageForm: 'Tablet', strength: '500mg', packSize: '5 Tablets / Strip', price: '130.00', discountedPrice: '115.00', stockQuantity: 90, requiresPrescription: true, isAgeRestricted: false, imageUrl: null, manufacturer: 'Alembic' },
	{ id: 'f8', name: 'Multivitamin Complex + Zinc', genericName: 'Multivitamins', brandName: 'Becadexamin', dosageForm: 'Capsule', strength: 'Daily', packSize: '30 Capsules / Bottle', price: '60.00', discountedPrice: '52.00', stockQuantity: 350, requiresPrescription: false, isAgeRestricted: false, imageUrl: null, manufacturer: 'GSK' }
];

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const category = url.searchParams.get('category') ?? '';
	const prescription = url.searchParams.get('prescription') ?? '';
	const sortBy = url.searchParams.get('sort') ?? 'newest';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
	const limit = 20;
	const offset = (page - 1) * limit;

	try {
		const categories = await db.select().from(medicineCategories).where(eq(medicineCategories.isActive, true)).orderBy(medicineCategories.sortOrder);

		const conditions: any[] = [eq(medicines.isActive, true)];

		if (q) {
			conditions.push(
				sql`(${medicines.name} ilike ${`%${q}%`} OR ${medicines.genericName} ilike ${`%${q}%`} OR ${medicines.brandName} ilike ${`%${q}%`} OR ${medicines.composition} ilike ${`%${q}%`})`
			);
		}
		if (category) {
			const cat = categories.find(c => c.slug === category);
			if (cat) conditions.push(eq(medicines.categoryId, cat.id));
		}
		if (prescription === 'yes') conditions.push(eq(medicines.requiresPrescription, true));
		if (prescription === 'no') conditions.push(eq(medicines.requiresPrescription, false));

		let orderClause: any;
		if (sortBy === 'price_asc') orderClause = asc(medicines.discountedPrice);
		else if (sortBy === 'price_desc') orderClause = desc(medicines.discountedPrice);
		else if (sortBy === 'name') orderClause = asc(medicines.name);
		else orderClause = desc(medicines.createdAt);

		const medsList = await db.select({
			id: medicines.id,
			name: medicines.name,
			genericName: medicines.genericName,
			brandName: medicines.brandName,
			dosageForm: medicines.dosageForm,
			strength: medicines.strength,
			packSize: medicines.packSize,
			price: medicines.price,
			discountedPrice: medicines.discountedPrice,
			stockQuantity: medicines.stockQuantity,
			requiresPrescription: medicines.requiresPrescription,
			isAgeRestricted: medicines.isAgeRestricted,
			imageUrl: medicines.imageUrl,
			manufacturer: medicines.manufacturer
		})
			.from(medicines)
			.where(and(...conditions))
			.orderBy(orderClause)
			.limit(limit)
			.offset(offset);

		return {
			medicines: medsList.length > 0 ? medsList : (q || category || prescription ? [] : FALLBACK_MEDICINES),
			categories: categories.length > 0 ? categories : FALLBACK_CATEGORIES,
			q, category, prescription, sortBy, page
		};
	} catch (err) {
		console.warn('Database query failed in shop load, using fallback data:', err);
		let filtered = FALLBACK_MEDICINES;
		if (q) {
			filtered = filtered.filter(m => m.name.toLowerCase().includes(q.toLowerCase()) || m.genericName.toLowerCase().includes(q.toLowerCase()));
		}
		if (prescription === 'yes') filtered = filtered.filter(m => m.requiresPrescription);
		if (prescription === 'no') filtered = filtered.filter(m => !m.requiresPrescription);

		return {
			medicines: filtered,
			categories: FALLBACK_CATEGORIES,
			q, category, prescription, sortBy, page
		};
	}
};
