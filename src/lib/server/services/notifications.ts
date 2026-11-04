import { db } from '../db';
import { notifications } from '../db/schema';

export async function createNotification(
	userId: string,
	title: string,
	message: string,
	type: string,
	link?: string
) {
	await db.insert(notifications).values({ userId, title, message, type, link });
}
