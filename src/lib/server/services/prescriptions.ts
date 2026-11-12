import { db } from '$lib/server/db';
import { prescriptions } from '$lib/server/db/schema';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'application/pdf': 'pdf'
};

function hasValidSignature(type: string, bytes: Uint8Array) {
	if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
	if (type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
	if (type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
	if (type === 'application/pdf') return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
	return false;
}

export async function savePrescriptionFile(file: File, customerId: string) {
	if (!file || file.size === 0) return { error: 'Please select a file to upload' as const };
	if (file.size > MAX_BYTES) return { error: 'File size must be 5 MB or smaller' as const };
	const extension = MIME_EXTENSIONS[file.type];
	if (!extension) return { error: 'Only JPG, PNG, WebP, or PDF files are allowed' as const };

	const bytes = new Uint8Array(await file.arrayBuffer());
	if (!hasValidSignature(file.type, bytes)) return { error: 'The uploaded file does not match its file type' as const };
	const filename = `${randomBytes(24).toString('hex')}.${extension}`;
	let storageKey = `prescriptions/${filename}`;

	if (process.env.NODE_ENV === 'production') {
		const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
			return { error: 'Private prescription storage is not configured. Please contact the administrator.' as const };
		}
		const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
		const s3 = new S3Client({
			region: 'auto',
			endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
			credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }
		});
		await s3.send(new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: storageKey,
			Body: Buffer.from(bytes),
			ContentType: file.type,
			ContentDisposition: `attachment; filename="prescription.${extension}"`
		}));
	} else {
		const uploadsDir = join(process.cwd(), 'uploads', 'prescriptions');
		await mkdir(uploadsDir, { recursive: true });
		await writeFile(join(uploadsDir, filename), Buffer.from(bytes));
		storageKey = `local:${filename}`;
	}

	const [rx] = await db.insert(prescriptions).values({
		customerId,
		fileUrl: storageKey,
		originalFilename: file.name.replace(/[\\/\u0000-\u001f]/g, '').slice(0, 255) || `prescription.${extension}`,
		mimeType: file.type,
		fileSize: file.size,
		status: 'PENDING_VERIFICATION'
	}).returning();

	return { prescriptionId: rx.id };
}
