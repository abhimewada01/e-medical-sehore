import { db } from '$lib/server/db';
import { doctors, users, orders, doctorReferralEvents } from '$lib/server/db/schema';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import QRCode from 'qrcode';
import { env } from '$env/dynamic/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const appUrl = env.PUBLIC_APP_URL ?? 'http://localhost:5173';
	const doctorList = await db.select({
		id: doctors.id,
		userId: doctors.userId,
		licenseNumber: doctors.licenseNumber,
		qualification: doctors.qualification,
		specialization: doctors.specialization,
		clinicName: doctors.clinicName,
		phone: doctors.phone,
		referralCode: doctors.referralCode,
		verificationStatus: doctors.verificationStatus,
		isActive: doctors.isActive,
		createdAt: doctors.createdAt
	}).from(doctors).orderBy(desc(doctors.createdAt));
	const attributedOrders = doctorList.length
		? await db.select({ doctorId: orders.doctorId, customerId: orders.customerId })
			.from(orders).where(inArray(orders.doctorId, doctorList.map((d) => d.id)))
		: [];
	const referredRegistrations = doctorList.length
		? await db.select({ doctorId: doctorReferralEvents.doctorId, customerId: doctorReferralEvents.customerId })
			.from(doctorReferralEvents).where(and(
				inArray(doctorReferralEvents.doctorId, doctorList.map((d) => d.id)),
				eq(doctorReferralEvents.eventType, 'REGISTRATION')
			))
		: [];
	const clientSets = new Map<string, Set<string>>();
	for (const referral of referredRegistrations) {
		if (!referral.customerId) continue;
		if (!clientSets.has(referral.doctorId)) clientSets.set(referral.doctorId, new Set());
		clientSets.get(referral.doctorId)!.add(referral.customerId);
	}
	for (const order of attributedOrders) {
		if (!order.doctorId) continue;
		if (!clientSets.has(order.doctorId)) clientSets.set(order.doctorId, new Set());
		clientSets.get(order.doctorId)!.add(order.customerId);
	}

	const userIds = doctorList.map(d => d.userId);
	const docUserMap: Record<string, { fullName: string; email: string }> = {};
	if (userIds.length > 0) {
		const docUsers = await db.select({ id: users.id, fullName: users.fullName, email: users.email })
			.from(users).where(inArray(users.id, userIds));
		docUsers.forEach(u => docUserMap[u.id] = { fullName: u.fullName, email: u.email });
	}

	return {
		doctors: await Promise.all(doctorList.map(async d => ({
			...d,
			clientCount: clientSets.get(d.id)?.size ?? 0,
			fullName: docUserMap[d.userId]?.fullName ?? 'Unknown',
			email: docUserMap[d.userId]?.email ?? '',
			referralUrl: `${appUrl}/refer/${d.referralCode}`,
			qrCodeDataUrl: await QRCode.toDataURL(`${appUrl}/refer/${d.referralCode}`, {
				width: 300,
				margin: 2,
				color: { dark: '#059669', light: '#ffffff' }
			})
		})))
	};
};

export const actions: Actions = {
	addDoctor: async ({ request }) => {
		const schema = z.object({
			fullName: z.string().min(2).max(100),
			email: z.string().email(),
			phone: z.string().min(10).max(15),
			qualification: z.string().min(2).max(255),
			clinicName: z.string().min(2).max(255),
			clinicAddress: z.string().min(5)
		});
		const formData = Object.fromEntries(await request.formData());
		const result = schema.safeParse(formData);
		if (!result.success) return fail(400, { errors: result.error.flatten().fieldErrors, values: formData });

		const { fullName, email, phone, qualification, clinicName, clinicAddress } = result.data;
		// Keep the existing non-null database column compatible without presenting a placeholder as a real license.
		const licenseNumber = `NOT_PROVIDED-${randomBytes(8).toString('hex').toUpperCase()}`;
		const specialization = 'Not specified';

		// Check if email exists
		const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase()));
		if (existing.length) return fail(400, { error: 'Email already registered', values: formData });
		// Generate temp password
		const tempPassword = randomBytes(8).toString('hex');
		const { hashPassword } = await import('$lib/server/auth/password');
		const passwordHash = await hashPassword(tempPassword);

		// Generate referral code
		const refCode = `DOC-${clinicName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')}-${randomBytes(3).toString('hex').toUpperCase()}`;

		// Generate QR code
		const appUrl = env.PUBLIC_APP_URL ?? 'http://localhost:5173';
		const qrDataUrl = await QRCode.toDataURL(`${appUrl}/refer/${refCode}`, {
			width: 300,
			margin: 2,
			color: { dark: '#059669', light: '#ffffff' }
		});

		// Create user and doctor in transaction
		try {
			await db.transaction(async (tx) => {
				const [newUser] = await tx.insert(users).values({
					fullName, email: email.toLowerCase(), phone, passwordHash,
					role: 'DOCTOR', isEmailVerified: false, ageVerified: false, isActive: true
				}).returning();

				await tx.insert(doctors).values({
					userId: newUser.id, licenseNumber, qualification, specialization,
					clinicName, clinicAddress, phone,
					referralCode: refCode,
					qrCodeDataUrl: qrDataUrl,
					verificationStatus: 'PENDING',
					bio: null,
					isActive: true
				});
			});
		} catch (cause) {
			if (typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '23505') {
				return fail(400, { error: 'This email, license number, or referral code is already in use', values: formData });
			}
			console.error('Failed to create doctor account', cause);
			return fail(500, { error: 'Could not create the doctor account. Please check the server log and try again.', values: formData });
		}

		return {
			success: true,
			credentials: {
				email: email.toLowerCase(),
				password: tempPassword,
				referralUrl: `${appUrl}/refer/${refCode}`,
				qrCodeDataUrl: qrDataUrl
			}
		};
	},
	toggleStatus: async ({ request }) => {
		const data = Object.fromEntries(await request.formData());
		const id = data.id as string;
		if (!id) return fail(400, { error: 'Missing id' });
		const [doc] = await db.select({ isActive: doctors.isActive }).from(doctors).where(eq(doctors.id, id));
		if (!doc) return fail(404, { error: 'Doctor not found' });
		await db.update(doctors).set({ isActive: !doc.isActive, updatedAt: new Date() }).where(eq(doctors.id, id));
	},
	verify: async ({ request }) => {
		const data = Object.fromEntries(await request.formData());
		const { id, status } = data;
		if (!id || !['VERIFIED', 'REJECTED'].includes(status as string)) return fail(400, { error: 'Invalid input' });
		await db.update(doctors).set({ verificationStatus: status as string, updatedAt: new Date() })
			.where(eq(doctors.id, id as string));
	}
};
