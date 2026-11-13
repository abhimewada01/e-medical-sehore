import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { loginRateLimits, users } from '$lib/server/db/schema';
import { and, eq, gt, sql } from 'drizzle-orm';
import { createHmac } from 'crypto';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import { createSession } from '$lib/server/auth/session';
import { loginSchema } from '$lib/server/validation/auth';

const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const fallbackLoginAttempts = new Map<string, { attempts: number; windowEndsAt: Date }>();

function isMissingRateLimitTable(cause: unknown) {
	return typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '42P01';
}

function loginLimitKey(ip: string) {
	return createHmac('sha256', process.env.JWT_SECRET ?? 'local-rate-limit-key').update(ip).digest('hex');
}

function safeReturnPath(url: URL) {
	const value = url.searchParams.get('redirect');
	if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
	const target = new URL(value, url.origin);
	return target.origin === url.origin ? `${target.pathname}${target.search}${target.hash}` : null;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const returnPath = safeReturnPath(url);
		if (returnPath && locals.user.role === 'CUSTOMER') redirect(302, returnPath);
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
	default: async ({ request, cookies, getClientAddress, url }) => {
		const data = Object.fromEntries(await request.formData());
		const result = loginSchema.safeParse(data);
		if (!result.success) {
			return fail(400, { errors: result.error.flatten().fieldErrors, email: data.email as string });
		}

		const { email, password } = result.data;
		const ip = getClientAddress();
		const now = new Date();
		const key = loginLimitKey(ip);
		let rateLimitTableAvailable = true;
		let currentAttempts: typeof loginRateLimits.$inferSelect | undefined;
		try {
			[currentAttempts] = await db.select().from(loginRateLimits).where(eq(loginRateLimits.key, key)).limit(1);
		} catch (cause) {
			if (!isMissingRateLimitTable(cause)) throw cause;
			rateLimitTableAvailable = false;
		}
		if (!rateLimitTableAvailable) {
			for (const [attemptKey, record] of fallbackLoginAttempts) {
				if (record.windowEndsAt <= now) fallbackLoginAttempts.delete(attemptKey);
			}
			currentAttempts = fallbackLoginAttempts.has(key)
				? { key, attempts: fallbackLoginAttempts.get(key)!.attempts, windowEndsAt: fallbackLoginAttempts.get(key)!.windowEndsAt, updatedAt: now }
				: undefined;
		}
		if (currentAttempts && currentAttempts.windowEndsAt > now && currentAttempts.attempts >= MAX_LOGIN_ATTEMPTS) {
			return fail(429, { error: 'Too many sign-in attempts. Please wait and try again.', email });
		}
		if (rateLimitTableAvailable && currentAttempts && currentAttempts.windowEndsAt <= now) {
			await db.delete(loginRateLimits).where(eq(loginRateLimits.key, key));
		}

		const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
		const valid = !!user?.isActive && !!user.passwordHash && await verifyPassword(password, user.passwordHash);
		if (!valid || !user) {
			const windowEndsAt = new Date(now.getTime() + LOGIN_WINDOW_MS);
			if (rateLimitTableAvailable) {
				await db.insert(loginRateLimits).values({ key, attempts: 1, windowEndsAt, updatedAt: now })
					.onConflictDoUpdate({
						target: loginRateLimits.key,
						set: {
							attempts: sql`CASE WHEN ${loginRateLimits.windowEndsAt} <= ${now} THEN 1 ELSE ${loginRateLimits.attempts} + 1 END`,
							windowEndsAt: sql`CASE WHEN ${loginRateLimits.windowEndsAt} <= ${now} THEN ${windowEndsAt} ELSE ${loginRateLimits.windowEndsAt} END`,
							updatedAt: now
						}
					});
			} else {
				const fallback = currentAttempts && currentAttempts.windowEndsAt > now ? currentAttempts : undefined;
				fallbackLoginAttempts.set(key, { attempts: (fallback?.attempts ?? 0) + 1, windowEndsAt: fallback?.windowEndsAt ?? windowEndsAt });
			}
			return fail(400, { error: 'Invalid email or password', email });
		}
		if (rateLimitTableAvailable) await db.delete(loginRateLimits).where(eq(loginRateLimits.key, key));
		else fallbackLoginAttempts.delete(key);
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
			const returnPath = safeReturnPath(url);
			if (returnPath) redirect(302, returnPath);
			redirect(302, '/customer/dashboard');
		}
	}
};
