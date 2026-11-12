import { fail } from '@sveltejs/kit';
import { createHash, randomBytes } from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { passwordResetTokens, users } from '$lib/server/db/schema';
import { forgotPasswordSchema } from '$lib/server/validation/auth';
import type { Actions } from './$types';

const GENERIC_MESSAGE = 'If an active account uses that email, we will send a password reset link.';

export const actions: Actions = {
	default: async ({ request, url }) => {
		const result = forgotPasswordSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!result.success) return fail(400, { error: 'Enter a valid email address.' });

		const { RESEND_API_KEY, EMAIL_FROM } = process.env;
		if (!RESEND_API_KEY || !EMAIL_FROM) {
			return fail(503, { error: 'Password reset email is temporarily unavailable. Please contact the administrator.' });
		}

		const email = result.data.email.toLowerCase().trim();
		const [user] = await db.select({ id: users.id, email: users.email, isActive: users.isActive })
			.from(users).where(eq(users.email, email)).limit(1);
		if (!user?.isActive) return { success: GENERIC_MESSAGE };

		const recentTokens = await db.select({ id: passwordResetTokens.id }).from(passwordResetTokens)
			.where(and(eq(passwordResetTokens.userId, user.id), gt(passwordResetTokens.createdAt, new Date(Date.now() - 60 * 60 * 1000))));
		if (recentTokens.length >= 3) return { success: GENERIC_MESSAGE };

		const token = randomBytes(32).toString('base64url');
		const tokenHash = createHash('sha256').update(token).digest('hex');
		await db.insert(passwordResetTokens).values({
			userId: user.id,
			tokenHash,
			expiresAt: new Date(Date.now() + 30 * 60 * 1000)
		});
		let baseUrl = url.origin;
		try {
			const configuredUrl = process.env.PUBLIC_APP_URL ? new URL(process.env.PUBLIC_APP_URL) : null;
			if (configuredUrl && (process.env.NODE_ENV !== 'production' || (configuredUrl.protocol === 'https:' && !['localhost', '127.0.0.1'].includes(configuredUrl.hostname)))) {
				baseUrl = configuredUrl.origin;
			}
		} catch {
			// Use the current request origin when the optional configured URL is malformed.
		}
		const resetUrl = new URL('/auth/reset-password', baseUrl);
		resetUrl.searchParams.set('token', token);
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: EMAIL_FROM,
				to: [user.email],
				subject: 'Reset your E-Medical Sehore password',
				text: `Use this link within 30 minutes to reset your password: ${resetUrl.toString()}\nIf you did not request a reset, ignore this email.`
			})
		});
		if (!response.ok) {
			await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
			console.error('Password reset email delivery failed:', response.status);
			return fail(503, { error: 'Password reset email is temporarily unavailable. Please try again later.' });
		}
		return { success: GENERIC_MESSAGE };
	}
};
