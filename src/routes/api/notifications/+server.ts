import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { notifications } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	const notifs = await db.select().from(notifications)
		.where(eq(notifications.userId, locals.user.id))
		.orderBy(desc(notifications.createdAt))
		.limit(20);
	return json(notifs);
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');
	const { id } = await request.json();
	if (id) {
		await db.update(notifications).set({ isRead: true })
			.where(eq(notifications.id, id));
	} else {
		// Mark all as read
		await db.update(notifications).set({ isRead: true })
			.where(eq(notifications.userId, locals.user.id));
	}
	return json({ success: true });
};
