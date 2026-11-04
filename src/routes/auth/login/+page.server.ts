import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import { createSession } from '$lib/server/auth/session';
import { loginSchema } from '$lib/server/validation/auth';

const attemptsByIp = new Map<string, { count: number; windowEndsAt: number }>();
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		const role = locals.user.role;
		if (role === 'SUPER_ADMIN' || role === 'PHARMACY_ADMIN' || role === 'PHARMACIST') {
			redirect(302, '/admin/dashboard');
		} else if (role === 'DOCTOR') {
			redirect(302, '/doctor/dashboard');
		} else {
			redirect(302, '/customer/dashboard');
		}
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const data = Object.fromEntries(await request.formData());
		const result = loginSchema.safeParse(data);
		if (!result.success) {
			return fail(400, { errors: result.error.flatten().fieldErrors, email: data.email as string });
		}

		const { email, password } = result.data;
		const ip = getClientAddress();
		const now = Date.now();
		const currentAttempts = attemptsByIp.get(ip);
		if (currentAttempts && currentAttempts.windowEndsAt > now && currentAttempts.count >= MAX_LOGIN_ATTEMPTS) {
			return fail(429, { error: 'Too many sign-in attempts. Please wait and try again.', email });
		}
		if (!currentAttempts || currentAttempts.windowEndsAt <= now) {
			if (attemptsByIp.size > 10000) {
				for (const [key, value] of attemptsByIp) {
					if (value.windowEndsAt <= now) attemptsByIp.delete(key);
				}
			}
			attemptsByIp.set(ip, { count: 0, windowEndsAt: now + LOGIN_WINDOW_MS });
		}

		const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
		const valid = !!user?.isActive && !!user.passwordHash && await verifyPassword(password, user.passwordHash);
		if (!valid || !user) {
			const attempt = attemptsByIp.get(ip)!;
			attempt.count += 1;
			return fail(400, { error: 'Invalid email or password', email });
		}
		attemptsByIp.delete(ip);
		if (user.passwordHash?.startsWith('sha256:')) {
			await db.update(users).set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
				.where(eq(users.id, user.id));
		}

		const { token, expiresAt } = await createSession(user.id, getClientAddress(), request.headers.get('user-agent') ?? undefined);
		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			expires: expiresAt
		});

		const role = user.role;
		if (role === 'SUPER_ADMIN' || role === 'PHARMACY_ADMIN' || role === 'PHARMACIST') {
			redirect(302, '/admin/dashboard');
		} else if (role === 'DOCTOR') {
			redirect(302, '/doctor/dashboard');
		} else {
			redirect(302, '/customer/dashboard');
		}
	}
};
