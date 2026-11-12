import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { prescriptions } from '$lib/server/db/schema';
import { isAdminRole } from '$lib/server/orders';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Sign in to view this prescription');
	const [rx] = await db.select().from(prescriptions).where(eq(prescriptions.id, params.prescriptionId)).limit(1);
	if (!rx) error(404, 'Prescription not found');
	if (rx.customerId !== locals.user.id && !isAdminRole(locals.user.role)) error(404, 'Prescription not found');

	const storedValue = rx.fileUrl;
	let key = storedValue;
	if (storedValue.startsWith('https://') || storedValue.startsWith('http://')) {
		try { key = new URL(storedValue).pathname.replace(/^\/+/, ''); } catch { error(404, 'Prescription file not found'); }
	} else if (storedValue.startsWith('/uploads/prescriptions/')) {
		key = `local:${storedValue.split('/').pop()}`;
	}

	if (key.startsWith('local:')) {
		const filename = key.slice('local:'.length);
		if (!/^(?:[a-f0-9]{32}|[a-f0-9]{48})\.(jpg|png|webp|pdf)$/i.test(filename)) error(404, 'Prescription file not found');
		try {
			const bytes = await readFile(join(process.cwd(), 'uploads', 'prescriptions', filename));
			return new Response(bytes, {
				headers: {
					'Content-Type': rx.mimeType,
					'Content-Disposition': `attachment; filename="prescription.${filename.split('.').pop()}"`,
					'Cache-Control': 'private, no-store',
					'X-Content-Type-Options': 'nosniff'
				}
			});
		} catch { error(404, 'Prescription file not found'); }
	}

	const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
	if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) error(503, 'Private file storage is not configured');
	if (!/^prescriptions\/(?:[a-f0-9]{32}|[a-f0-9]{48})\.(jpg|png|webp|pdf)$/i.test(key)) error(404, 'Prescription file not found');
	const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
	const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
	const client = new S3Client({
		region: 'auto',
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }
	});
	const url = await getSignedUrl(client, new GetObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: key,
		ResponseContentType: rx.mimeType,
		ResponseContentDisposition: `attachment; filename="prescription.${key.split('.').pop()}"`
	}), { expiresIn: 300 });
	redirect(302, url);
};
