import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { notifications } from '$lib/server/db/schema';
import { and, count, eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/auth/login');
	const adminRoles = ['SUPER_ADMIN', 'PHARMACY_ADMIN', 'PHARMACIST'];
	if (!adminRoles.includes(locals.user.role)) redirect(302, '/');
	const [unread] = await db.select({ total: count() }).from(notifications)
		.where(and(eq(notifications.userId, locals.user.id), eq(notifications.isRead, false)));
	return { user: locals.user, unreadNotifications: Number(unread?.total ?? 0) };
};
