import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

function hasValidSignature(type: string, bytes: Uint8Array) {
	if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
	if (type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
	if (type === 'image/webp') {
		return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
	}
	return false;
}

export async function saveMedicineImage(file: File): Promise<{ url: string } | { error: string }> {
	if (!file || file.size === 0) return { error: 'Choose a medicine photo first' };
	if (file.size > MAX_IMAGE_BYTES) return { error: 'Medicine photos must be 5 MB or smaller' };
	const extension = IMAGE_EXTENSIONS[file.type];
	if (!extension) return { error: 'Use a JPG, PNG, or WebP image' };

	const bytes = new Uint8Array(await file.arrayBuffer());
	if (!hasValidSignature(file.type, bytes)) return { error: 'The uploaded file does not match its image type' };
	const filename = `${randomBytes(16).toString('hex')}.${extension}`;

	if (process.env.NODE_ENV === 'production') {
		const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
			return { error: 'Product photo storage is not configured. Ask the site administrator to configure R2.' };
		}
		const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
		const s3 = new S3Client({
			region: 'auto',
			endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
			credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }
		});
		await s3.send(new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: `medicine-images/${filename}`,
			Body: Buffer.from(bytes),
			ContentType: file.type,
			CacheControl: 'public, max-age=31536000, immutable'
		}));
		return { url: `${R2_PUBLIC_URL.replace(/\/$/, '')}/medicine-images/${filename}` };
	}

	const uploadsDir = join(process.cwd(), 'static', 'uploads', 'medicines');
	await mkdir(uploadsDir, { recursive: true });
	await writeFile(join(uploadsDir, filename), Buffer.from(bytes), { flag: 'wx' });
	return { url: `/uploads/medicines/${filename}` };
}
