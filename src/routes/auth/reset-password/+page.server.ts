import { fail, redirect } from '@sveltejs/kit';
import { createHash } from 'crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { passwordResetTokens, userSessions, users } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth/password';
import { resetPasswordSchema } from '$lib/server/validation/auth';
import type { Actions, PageServerLoad } from './$types';

function hashToken(token: string) {
	return createHash('sha256').update(token).digest('hex');
}

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) return { tokenValid: false, token };
	const [record] = await db.select({ id: passwordResetTokens.id }).from(passwordResetTokens)
		.where(and(eq(passwordResetTokens.tokenHash, hashToken(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())))
		.limit(1);
	return { tokenValid: !!record, token };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = Object.fromEntries(await request.formData());
		const result = resetPasswordSchema.safeParse(formData);
		if (!result.success) return fail(400, { error: 'Choose a password of at least 8 characters and confirm it.', token: String(formData.token ?? '') });
		const tokenHash = hashToken(result.data.token);
		const passwordHash = await hashPassword(result.data.password);
		const now = new Date();
		const changed = await db.transaction(async (tx) => {
			const [record] = await tx.select().from(passwordResetTokens)
				.where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, now)))
				.limit(1).for('update');
			if (!record) return false;
			await tx.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, record.userId));
			await tx.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.userId, record.userId));
			await tx.delete(userSessions).where(eq(userSessions.userId, record.userId));
			return true;
		});
		if (!changed) return fail(400, { error: 'This reset link is invalid or expired. Request a new one.', token: result.data.token });
		cookies.delete('session', { path: '/' });
		redirect(303, '/auth/login?passwordReset=1');
	}
};
