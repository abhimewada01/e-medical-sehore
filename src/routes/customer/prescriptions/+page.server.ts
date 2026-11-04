import { db } from '$lib/server/db';
import { prescriptions } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const rxList = await db.select().from(prescriptions)
		.where(eq(prescriptions.customerId, userId))
		.orderBy(desc(prescriptions.createdAt));
	return { prescriptions: rxList };
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		const file = formData.get('prescription') as File | null;

		if (!file || file.size === 0) return fail(400, { error: 'Please select a file to upload' });

		// Validate MIME type
		const allowedMimes = ['image/jpeg','image/png','image/webp','application/pdf'];
		if (!allowedMimes.includes(file.type)) {
			return fail(400, { error: 'Only JPG, PNG, WebP, or PDF files are allowed' });
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			return fail(400, { error: 'File size must be less than 5MB' });
		}

		const ext = file.name.split('.').pop() ?? 'jpg';
		const filename = `${randomBytes(16).toString('hex')}.${ext}`;

		// Save to static/uploads (dev) or R2 (production)
		let fileUrl: string;
		if (process.env.NODE_ENV === 'production' && process.env.R2_BUCKET_NAME) {
			// In production, upload to R2
			const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
			const s3 = new S3Client({
				region: 'auto',
				endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
				credentials: {
					accessKeyId: process.env.R2_ACCESS_KEY_ID!,
					secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
				}
			});
			const bytes = await file.arrayBuffer();
			await s3.send(new PutObjectCommand({
				Bucket: process.env.R2_BUCKET_NAME,
				Key: `prescriptions/${filename}`,
				Body: Buffer.from(bytes),
				ContentType: file.type
			}));
			fileUrl = `${process.env.R2_PUBLIC_URL}/prescriptions/${filename}`;
		} else {
			// Dev: save to static/uploads
			const uploadsDir = join(process.cwd(), 'static', 'uploads', 'prescriptions');
			await mkdir(uploadsDir, { recursive: true });
			const bytes = await file.arrayBuffer();
			await writeFile(join(uploadsDir, filename), Buffer.from(bytes));
			fileUrl = `/uploads/prescriptions/${filename}`;
		}

		const [rx] = await db.insert(prescriptions).values({
			customerId: userId,
			fileUrl,
			originalFilename: file.name,
			mimeType: file.type,
			fileSize: file.size,
			status: 'PENDING_VERIFICATION'
		}).returning();

		return { success: true, prescriptionId: rx.id };
	}
};
