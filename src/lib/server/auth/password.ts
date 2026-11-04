import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const SCRYPT_BYTES = 64;

function constantTimeHexEquals(left: string, right: string) {
	if (!/^[0-9a-f]+$/i.test(left) || !/^[0-9a-f]+$/i.test(right)) return false;
	const leftBytes = Buffer.from(left, 'hex');
	const rightBytes = Buffer.from(right, 'hex');
	return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString('hex');
	const hashed = (await scrypt(password, salt, SCRYPT_BYTES)) as Buffer;
	return `scrypt:${salt}:${hashed.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [algo, salt, hash, extra] = stored.split(':');
	if (!salt || !hash || extra) return false;

	if (algo === 'scrypt') {
		const hashed = (await scrypt(password, salt, SCRYPT_BYTES)) as Buffer;
		return constantTimeHexEquals(hashed.toString('hex'), hash);
	}

	// Keep existing accounts working and upgrade their hash after a successful login.
	if (algo === 'sha256') {
		const hashed = createHash('sha256').update(salt + password).digest('hex');
		return constantTimeHexEquals(hashed, hash);
	}
	return false;
}
