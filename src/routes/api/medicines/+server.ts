import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { medicines } from '$lib/server/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const limit = Math.min(20, Math.max(1, Number(url.searchParams.get('limit') ?? '10')));

	if (!q) {
		const results = await db.select({
			id: medicines.id,
			name: medicines.name,
			genericName: medicines.genericName,
			brandName: medicines.brandName,
			discountedPrice: medicines.discountedPrice,
			price: medicines.price,
			requiresPrescription: medicines.requiresPrescription,
			dosageForm: medicines.dosageForm
		}).from(medicines).where(eq(medicines.isActive, true)).limit(limit);
		return json(results);
	}

	const searchPattern = `%${q}%`;
	const results = await db.select({
		id: medicines.id,
		name: medicines.name,
		genericName: medicines.genericName,
		brandName: medicines.brandName,
		discountedPrice: medicines.discountedPrice,
		price: medicines.price,
		requiresPrescription: medicines.requiresPrescription,
		dosageForm: medicines.dosageForm
	}).from(medicines).where(
		and(
			eq(medicines.isActive, true),
			or(
				ilike(medicines.name, searchPattern),
				ilike(medicines.genericName, searchPattern),
				ilike(medicines.brandName, searchPattern),
				ilike(medicines.composition, searchPattern)
			)
		)
	).limit(limit);

	return json(results);
};
