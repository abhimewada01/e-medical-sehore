import { db } from '$lib/server/db';
import { prescriptions } from '$lib/server/db/schema';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 5 * 1024 * 1024;

export async function savePrescriptionFile(file: File, customerId: string) {
	if (!file || file.size === 0) return { error: 'Please select a file to upload' as const };
	if (!ALLOWED_MIMES.includes(file.type)) {
		return { error: 'Only JPG, PNG, WebP, or PDF files are allowed' as const };
	}
	if (file.size > MAX_BYTES) {
		return { error: 'File size must be less than 5MB' as const };
	}

	const ext = file.name.split('.').pop() ?? 'jpg';
	const filename = `${randomBytes(16).toString('hex')}.${ext}`;

	let fileUrl: string;
	if (process.env.NODE_ENV === 'production' && process.env.R2_BUCKET_NAME) {
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
		await s3.send(
			new PutObjectCommand({
				Bucket: process.env.R2_BUCKET_NAME,
				Key: `prescriptions/${filename}`,
				Body: Buffer.from(bytes),
				ContentType: file.type
			})
		);
		fileUrl = `${process.env.R2_PUBLIC_URL}/prescriptions/${filename}`;
	} else {
		const uploadsDir = join(process.cwd(), 'static', 'uploads', 'prescriptions');
		await mkdir(uploadsDir, { recursive: true });
		const bytes = await file.arrayBuffer();
		await writeFile(join(uploadsDir, filename), Buffer.from(bytes));
		fileUrl = `/uploads/prescriptions/${filename}`;
	}

	const [rx] = await db
		.insert(prescriptions)
		.values({
			customerId,
			fileUrl,
			originalFilename: file.name,
			mimeType: file.type,
			fileSize: file.size,
			status: 'PENDING_VERIFICATION'
		})
		.returning();

	return { prescriptionId: rx.id };
}
