import { z } from 'zod';

export const registerSchema = z
	.object({
		fullName: z.string().min(2).max(100),
		email: z.string().email(),
		phone: z
			.string()
			.regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')
			.optional()
			.or(z.literal('')),
		password: z.string().min(8).max(100),
		confirmPassword: z.string()
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
	email: z.string().email()
});

export const resetPasswordSchema = z
	.object({
		token: z.string().min(10),
		password: z.string().min(8).max(100),
		confirmPassword: z.string()
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export const addressSchema = z.object({
	recipientName: z.string().min(2).max(255),
	phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
	addressLine1: z.string().min(5).max(500),
	addressLine2: z.string().optional().or(z.literal('')),
	landmark: z.string().optional().or(z.literal('')),
	city: z.string().min(2).max(100).default('Sehore'),
	state: z.string().min(2).max(100).default('Madhya Pradesh'),
	postalCode: z.string().regex(/^\d{6}$/, 'Invalid PIN code'),
	isDefault: z.coerce.boolean().default(false)
});

export const doctorProfileSchema = z.object({
	clinicName: z.string().min(2).max(255),
	clinicAddress: z.string().min(5).max(1000),
	phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
	qualification: z.string().min(2).max(255),
	specialization: z.string().min(2).max(255),
	bio: z.string().max(2000).optional().or(z.literal(''))
});
