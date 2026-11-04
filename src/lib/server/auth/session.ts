import { SignJWT, jwtVerify } from 'jose';
import { db } from '../db';
import { userSessions, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { randomBytes } from 'crypto';

const configuredSecret = env.JWT_SECRET;
if (env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret.length < 32)) {
	throw new Error('JWT_SECRET must be configured with at least 32 characters in production');
}
const SECRET = new TextEncoder().encode(
	configuredSecret && configuredSecret.length >= 32
		? configuredSecret
		: 'local-development-only-secret-change-before-production'
);

export async function createSession(userId: string, ip?: string, ua?: string) {
	const sessionId = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
	await db.insert(userSessions).values({ id: sessionId, userId, expiresAt, ipAddress: ip, userAgent: ua });
	const token = await new SignJWT({ sessionId })
		.setProtectedHeader({ alg: 'HS256' })
		.setExpirationTime('7d')
		.sign(SECRET);
	return { token, expiresAt };
}

export async function validateSession(token: string) {
	try {
		const { payload } = await jwtVerify(token, SECRET);
		if (typeof payload.sessionId !== 'string') return null;
		const sessionId = payload.sessionId;
		const rows = await db.select().from(userSessions).where(eq(userSessions.id, sessionId)).limit(1);
		if (!rows.length || rows[0].expiresAt < new Date()) return null;
		const userRows = await db.select().from(users).where(eq(users.id, rows[0].userId)).limit(1);
		if (!userRows.length || !userRows[0].isActive) return null;
		return { session: rows[0], user: userRows[0] };
	} catch {
		return null;
	}
}

export async function deleteSession(sessionId: string) {
	await db.delete(userSessions).where(eq(userSessions.id, sessionId));
}

export async function createPasswordResetToken(userId: string) {
	return new SignJWT({ userId, purpose: 'password_reset' })
		.setProtectedHeader({ alg: 'HS256' })
		.setExpirationTime('1h')
		.sign(SECRET);
}

export async function verifyPasswordResetToken(token: string) {
	try {
		const { payload } = await jwtVerify(token, SECRET);
		if (payload.purpose !== 'password_reset' || typeof payload.userId !== 'string') return null;
		return payload.userId;
	} catch {
		return null;
	}
}
