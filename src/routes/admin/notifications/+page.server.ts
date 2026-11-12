import { db } from '$lib/server/db';
import { notifications } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const items = await db.select().from(notifications)
		.where(eq(notifications.userId, locals.user!.id))
		.orderBy(desc(notifications.createdAt)).limit(100);
	return { notifications: items };
};

export const actions: Actions = {
	markRead: async ({ locals, request }) => {
		const form = await request.formData();
		const notificationId = form.get('notificationId');
		const scope = and(eq(notifications.userId, locals.user!.id), eq(notifications.isRead, false));
		if (notificationId) {
			await db.update(notifications).set({ isRead: true })
				.where(and(scope, eq(notifications.id, String(notificationId))));
		} else {
			await db.update(notifications).set({ isRead: true }).where(scope);
		}
	},
	open: async ({ locals, request }) => {
		const form = await request.formData();
		const notificationId = form.get('notificationId');
		const [item] = await db.select().from(notifications).where(and(
			eq(notifications.id, String(notificationId ?? '')),
			eq(notifications.userId, locals.user!.id)
		)).limit(1);
		if (!item) return fail(404, { error: 'Notification not found' });
		await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, item.id));
		return { openedLink: item.link || '/admin/prescriptions' };
	}
};
