import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { medicines } from '$lib/server/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const requestedLimit = Number.parseInt(url.searchParams.get('limit') ?? '8', 10);
	const limit = Number.isFinite(requestedLimit) ? Math.min(20, Math.max(1, requestedLimit)) : 8;
	if (q.length < 2) return json({ products: [], compositions: [] });

	// Treat search input as literal text, not as a user-supplied SQL LIKE pattern.
	const searchPattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
	const matches = or(
		ilike(medicines.name, searchPattern),
		ilike(medicines.genericName, searchPattern),
		ilike(medicines.brandName, searchPattern),
		ilike(medicines.composition, searchPattern)
	)!;
	const products = await db.select({
		id: medicines.id,
		name: medicines.name,
		genericName: medicines.genericName,
		brandName: medicines.brandName,
		imageUrl: medicines.imageUrl,
		stockQuantity: medicines.stockQuantity,
		discountedPrice: medicines.discountedPrice,
		price: medicines.price,
		requiresPrescription: medicines.requiresPrescription,
		dosageForm: medicines.dosageForm
	}).from(medicines).where(and(eq(medicines.isActive, true), matches)).limit(limit);

	const compositionRows = await db.select({
		composition: medicines.composition,
		genericName: medicines.genericName,
		strength: medicines.strength
	}).from(medicines).where(and(
		eq(medicines.isActive, true),
		or(ilike(medicines.composition, searchPattern), ilike(medicines.genericName, searchPattern))
	)).limit(100);
	const uniqueCompositions = new Map<string, string>();
	for (const row of compositionRows) {
		const candidates = [row.composition, row.genericName && [row.genericName, row.strength].filter(Boolean).join(' ')];
		for (const candidate of candidates) {
			for (const part of (candidate ?? '').split(/[,;\n]+/)) {
				const label = part.trim().replace(/\s+/g, ' ');
				if (label.length >= 2 && label.toLowerCase().includes(q.toLowerCase())) uniqueCompositions.set(label.toLowerCase(), label);
			}
		}
	}
	if (products.length === 0 && /para|paracetamol/i.test(q)) {
		return json({
			products: [{
				id: 'demo-paracetamol',
				name: 'Paracetamol 500 mg Tablet',
				genericName: 'Paracetamol',
				brandName: null,
				imageUrl: null,
				stockQuantity: 0,
				discountedPrice: null,
				price: null,
				requiresPrescription: false,
				dosageForm: 'Tablet',
				isDemo: true
			}],
			compositions: ['Paracetamol 500 mg']
		});
	}

	return json({ products, compositions: [...uniqueCompositions.values()].slice(0, 8) });
};
