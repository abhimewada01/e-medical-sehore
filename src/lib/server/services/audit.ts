import { db } from '$lib/server/db';
import { auditLogs } from '$lib/server/db/schema';

export async function recordAuditLog(input: {
	actorId: string;
	actorRole: string;
	action: string;
	entityType: string;
	entityId?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
	details?: Record<string, unknown>;
}) {
	await db.insert(auditLogs).values({
		actorId: input.actorId,
		actorRole: input.actorRole,
		action: input.action,
		entityType: input.entityType,
		entityId: input.entityId ?? null,
		ipAddress: input.ipAddress ?? null,
		userAgent: input.userAgent ?? null,
		details: input.details ?? null
	});
}
