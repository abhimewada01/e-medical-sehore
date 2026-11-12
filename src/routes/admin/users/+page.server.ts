import { db } from '$lib/server/db';
import { userSessions, users } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth/password';
import { desc, eq } from 'drizzle-orm';
import { fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!['SUPER_ADMIN', 'PHARMACY_ADMIN'].includes(locals.user?.role ?? '')) error(403, 'User management access required');
	return { users: await db.select({
		id: users.id, fullName: users.fullName, email: users.email, phone: users.phone,
		role: users.role, isActive: users.isActive, createdAt: users.createdAt
	}).from(users).orderBy(desc(users.createdAt)).limit(500) };
};

export const actions: Actions = {
	setPassword: async ({ request, locals }) => {
		if (locals.user?.role !== 'SUPER_ADMIN') error(403, 'Only a super admin can reset account passwords');
		const form = await request.formData();
		const userId = String(form.get('userId') ?? '');
		const password = String(form.get('password') ?? '');
		if (!userId || password.length < 10) return fail(400, { error: 'Choose a password with at least 10 characters.' });
		const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
		if (!target) return fail(404, { error: 'User not found.' });
		await db.update(users).set({ passwordHash: await hashPassword(password), updatedAt: new Date() }).where(eq(users.id, userId));
		await db.delete(userSessions).where(eq(userSessions.userId, userId));
		return { passwordReset: true };
	},
	setActive: async ({ request, locals }) => {
		if (locals.user?.role !== 'SUPER_ADMIN') error(403, 'Only a super admin can change account access');
		const form = await request.formData();
		const userId = String(form.get('userId') ?? '');
		if (!userId || userId === locals.user.id) return fail(400, { error: 'You cannot change your own account access here.' });
		const [target] = await db.select({ id: users.id, isActive: users.isActive }).from(users).where(eq(users.id, userId)).limit(1);
		if (!target) return fail(404, { error: 'User not found.' });
		await db.update(users).set({ isActive: !target.isActive, updatedAt: new Date() }).where(eq(users.id, userId));
		if (target.isActive) await db.delete(userSessions).where(eq(userSessions.userId, userId));
		return { accessUpdated: true };
	}
};
