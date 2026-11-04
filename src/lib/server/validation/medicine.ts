import { z } from 'zod';

export const medicineSchema = z.object({
	name: z.string().min(2).max(255),
	genericName: z.string().optional().or(z.literal('')),
	brandName: z.string().optional().or(z.literal('')),
	categoryId: z.string().uuid(),
	description: z.string().optional().or(z.literal('')),
	dosageForm: z.string().min(1),
	strength: z.string().optional().or(z.literal('')),
	packSize: z.string().optional().or(z.literal('')),
	price: z.coerce.number().positive(),
	discountedPrice: z.coerce.number().positive(),
	stockQuantity: z.coerce.number().int().min(0),
	minStockAlert: z.coerce.number().int().min(0).default(10),
	requiresPrescription: z.coerce.boolean().default(false),
	isAgeRestricted: z.coerce.boolean().default(false),
	manufacturer: z.string().optional().or(z.literal('')),
	composition: z.string().optional().or(z.literal('')),
	sideEffects: z.string().optional().or(z.literal('')),
	usageInstructions: z.string().optional().or(z.literal('')),
	storageInstructions: z.string().optional().or(z.literal(''))
});

export type MedicineInput = z.infer<typeof medicineSchema>;
