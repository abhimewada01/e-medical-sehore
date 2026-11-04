import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, loyaltyWallets, doctors, doctorReferralEvents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '$lib/server/auth/password';
import { createSession } from '$lib/server/auth/session';
import { registerSchema } from '$lib/server/validation/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, '/customer/dashboard');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const data = Object.fromEntries(await request.formData());
		const result = registerSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				errors: result.error.flatten().fieldErrors,
				values: { fullName: data.fullName as string, email: data.email as string, phone: data.phone as string }
			});
		}

		const { fullName, email, phone, password } = result.data;

		// Check existing
		const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
		if (existing.length) {
			return fail(400, {
				error: 'An account with this email already exists',
				values: { fullName, email, phone }
			});
		}

		const passwordHash = await hashPassword(password);
		const [user] = await db.insert(users).values({
			fullName,
			email: email.toLowerCase(),
			phone: phone || null,
			passwordHash,
			role: 'CUSTOMER',
			isEmailVerified: false,
			ageVerified: false,
			isActive: true
		}).returning();

		// Create loyalty wallet
		await db.insert(loyaltyWallets).values({ userId: user.id });

		// Attribute registrations that came through a doctor's QR referral link.
		const referralCode = cookies.get('referral_code');
		if (referralCode) {
			const [doctor] = await db.select({ id: doctors.id }).from(doctors)
				.where(eq(doctors.referralCode, referralCode)).limit(1);
			if (doctor) {
				await db.insert(doctorReferralEvents).values({
					doctorId: doctor.id,
					referralCode,
					eventType: 'REGISTRATION',
					customerId: user.id
				});
			}
		}

		const { token, expiresAt } = await createSession(user.id, getClientAddress(), request.headers.get('user-agent') ?? undefined);
		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			expires: expiresAt
		});

		redirect(302, '/customer/dashboard');
	}
};
