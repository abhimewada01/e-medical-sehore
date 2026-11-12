/**
 * Database seed script
 * Run: npx tsx src/lib/server/db/seed.ts
 * Or add DATABASE_URL to env and run: node --loader ts-node/esm src/lib/server/db/seed.ts
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../auth/password.js';

try {
	process.loadEnvFile();
} catch {}

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
	throw new Error('DATABASE_URL, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD must be configured.');
}
const databaseUrl = DATABASE_URL;
const adminEmail = ADMIN_EMAIL;
const adminPassword = ADMIN_PASSWORD;

async function seed() {
	const client = postgres(databaseUrl);
	const db = drizzle(client, { schema });

	console.log('🌱 Seeding database...');

	// 1. Admin user
	const existingAdmin = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail));
	if (existingAdmin.length === 0) {
		const [admin] = await db.insert(schema.users).values({
			fullName: 'Pharmacy Admin',
			email: adminEmail,
			passwordHash: await hashPassword(adminPassword),
			role: 'SUPER_ADMIN',
			isEmailVerified: true,
			ageVerified: true,
			isActive: true
		}).returning();
		console.log(`✅ Admin created: ${adminEmail}`);
	} else {
		console.log(`⚠️  Admin already exists: ${adminEmail}`);
	}

	// 2. Medicine categories
	const categories = [
		{ name: 'Tablets & Capsules', slug: 'tablets', iconName: 'Pill', sortOrder: 1 },
		{ name: 'Syrups & Liquids', slug: 'syrups', iconName: 'Beaker', sortOrder: 2 },
		{ name: 'Vitamins & Supplements', slug: 'vitamins', iconName: 'Leaf', sortOrder: 3 },
		{ name: 'Skincare', slug: 'skincare', iconName: 'Sparkles', sortOrder: 4 },
		{ name: 'Baby Care', slug: 'baby-care', iconName: 'Baby', sortOrder: 5 },
		{ name: 'Devices & Equipment', slug: 'devices', iconName: 'Stethoscope', sortOrder: 6 },
		{ name: 'Wellness', slug: 'wellness', iconName: 'Heart', sortOrder: 7 },
		{ name: 'Sexual Wellness (18+)', slug: 'sexual-wellness', iconName: 'Shield', isAgeRestricted: true, sortOrder: 8 }
	];

	for (const cat of categories) {
		const existing = await db.select().from(schema.medicineCategories).where(eq(schema.medicineCategories.slug, cat.slug));
		if (existing.length === 0) {
			await db.insert(schema.medicineCategories).values({ ...cat, isActive: true });
		}
	}
	console.log('✅ Medicine categories seeded');

	// 3. Sample medicines
	const tabletsCat = await db.select().from(schema.medicineCategories).where(eq(schema.medicineCategories.slug, 'tablets')).then(r => r[0]);
	const vitaminsCat = await db.select().from(schema.medicineCategories).where(eq(schema.medicineCategories.slug, 'vitamins')).then(r => r[0]);
	const skincCat = await db.select().from(schema.medicineCategories).where(eq(schema.medicineCategories.slug, 'skincare')).then(r => r[0]);

	const sampleMedicines = [
		{ name: 'Paracetamol 500mg', genericName: 'Paracetamol', brandName: 'Dolo 650', categoryId: tabletsCat?.id, dosageForm: 'Tablet', strength: '500mg', packSize: '10 Tablets / Strip', price: '25.00', discountedPrice: '20.00', stockQuantity: 500, requiresPrescription: false, manufacturer: 'Micro Labs Ltd', composition: 'Paracetamol 500mg', usageInstructions: 'Take 1-2 tablets every 4-6 hours as needed. Do not exceed 8 tablets in 24 hours.', sideEffects: 'Rare: skin rash, liver damage with overdose', storageInstructions: 'Store below 30°C, away from moisture' },
		{ name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', brandName: 'Mox 500', categoryId: tabletsCat?.id, dosageForm: 'Capsule', strength: '500mg', packSize: '10 Capsules / Strip', price: '95.00', discountedPrice: '85.00', stockQuantity: 200, requiresPrescription: true, manufacturer: 'Ranbaxy', composition: 'Amoxicillin Trihydrate 500mg', usageInstructions: 'Take as directed by physician. Complete the full course.', sideEffects: 'Diarrhoea, nausea, skin rash, allergic reaction' },
		{ name: 'Vitamin C 500mg', genericName: 'Ascorbic Acid', brandName: 'Limcee', categoryId: vitaminsCat?.id, dosageForm: 'Tablet', strength: '500mg', packSize: '30 Tablets / Bottle', price: '120.00', discountedPrice: '99.00', stockQuantity: 300, requiresPrescription: false, manufacturer: 'Abbott India', composition: 'Ascorbic Acid 500mg', usageInstructions: 'Take 1 tablet daily with or after meals.' },
		{ name: 'Cetirizine 10mg', genericName: 'Cetirizine', brandName: 'Zyrtec', categoryId: tabletsCat?.id, dosageForm: 'Tablet', strength: '10mg', packSize: '10 Tablets / Strip', price: '35.00', discountedPrice: '28.00', stockQuantity: 400, requiresPrescription: false, manufacturer: 'GlaxoSmithKline', composition: 'Cetirizine Hydrochloride 10mg', usageInstructions: 'Take 1 tablet daily', sideEffects: 'Drowsiness, dry mouth' },
		{ name: 'Metformin 500mg', genericName: 'Metformin', brandName: 'Glycomet 500', categoryId: tabletsCat?.id, dosageForm: 'Tablet', strength: '500mg', packSize: '20 Tablets / Strip', price: '55.00', discountedPrice: '48.00', stockQuantity: 150, requiresPrescription: true, manufacturer: 'USV Ltd', composition: 'Metformin Hydrochloride 500mg', usageInstructions: 'Take with meals as directed by physician' },
		{ name: 'Vitamin D3 60000 IU', genericName: 'Cholecalciferol', brandName: 'D-Rise 60K', categoryId: vitaminsCat?.id, dosageForm: 'Capsule', strength: '60000 IU', packSize: '4 Capsules / Pack', price: '180.00', discountedPrice: '155.00', stockQuantity: 200, requiresPrescription: false, manufacturer: 'USV Ltd', composition: 'Cholecalciferol 60000 IU' },
		{ name: 'Sunscreen SPF 50+', genericName: 'Zinc Oxide + Titanium Dioxide', categoryId: skincCat?.id, dosageForm: 'Cream', strength: 'SPF 50+', packSize: '75g', price: '350.00', discountedPrice: '299.00', stockQuantity: 100, requiresPrescription: false, manufacturer: 'Lotus Herbals', usageInstructions: 'Apply 15 minutes before sun exposure' },
		{ name: 'Omeprazole 20mg', genericName: 'Omeprazole', brandName: 'Omez 20', categoryId: tabletsCat?.id, dosageForm: 'Capsule', strength: '20mg', packSize: '10 Capsules / Strip', price: '45.00', discountedPrice: '38.00', stockQuantity: 300, requiresPrescription: false, manufacturer: 'Dr. Reddys', composition: 'Omeprazole 20mg', usageInstructions: 'Take 30 minutes before meals' }
	];

	let medCount = 0;
	for (const med of sampleMedicines) {
		if (!med.categoryId) continue;
		const existing = await db.select().from(schema.medicines).where(eq(schema.medicines.name, med.name));
		if (existing.length === 0) {
			await db.insert(schema.medicines).values({
				...med,
				minStockAlert: 20,
				isAgeRestricted: false,
				isActive: true
			});
			medCount++;
		}
	}
	console.log(`✅ ${medCount} sample medicines seeded`);

	// 4. Admin settings
	const defaultSettings = [
		{ key: 'loyalty_enabled', value: 'true', description: 'Enable/disable loyalty rewards system' },
		{ key: 'loyalty_earn_percent', value: '5', description: 'Percentage of order value earned as coins' },
		{ key: 'min_order_for_coins', value: '200', description: 'Minimum order value (₹) to earn coins' },
		{ key: 'max_coins_per_order', value: '100', description: 'Maximum coins that can be earned per order' },
		{ key: 'coin_value_rupees', value: '0.1', description: 'Value of 1 coin in rupees' },
		{ key: 'max_coins_redemption_per_order', value: '50', description: 'Max coins redeemable per order' },
		{ key: 'coins_expiry_days', value: '30', description: 'Days until coins expire after earning' }
	];

	for (const s of defaultSettings) {
		const existing = await db.select().from(schema.adminSettings).where(eq(schema.adminSettings.key, s.key));
		if (existing.length === 0) {
			await db.insert(schema.adminSettings).values(s);
		}
	}
	console.log('✅ Admin settings seeded');

	await client.end();
	console.log('\n🎉 Seed completed successfully!');
	console.log(`\nAdmin login email: ${ADMIN_EMAIL}`);
}

seed().catch(err => {
	console.error('❌ Seed failed:', err);
	process.exit(1);
});
