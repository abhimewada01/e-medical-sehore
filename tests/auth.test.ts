import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/server/auth/password';

describe('Authentication & Password Security', () => {
	it('should securely hash a password with salt', async () => {
		const rawPassword = 'SuperSecretPassword@123';
		const hash = await hashPassword(rawPassword);

		expect(hash).toBeDefined();
		expect(hash).toMatch(/^scrypt:[0-9a-f]+:[0-9a-f]+$/);
		expect(hash.split(':').length).toBe(3);
	});

	it('continues to verify existing SHA-256 password hashes during migration', async () => {
		const legacyHash = 'sha256:legacy-salt:' + (await import('crypto')).createHash('sha256').update('legacy-saltLegacyPassword@123').digest('hex');
		expect(await verifyPassword('LegacyPassword@123', legacyHash)).toBe(true);
		expect(await verifyPassword('WrongPassword@123', legacyHash)).toBe(false);
	});

	it('should verify correct password successfully', async () => {
		const rawPassword = 'MySecretPassword#456';
		const hash = await hashPassword(rawPassword);
		const isValid = await verifyPassword(rawPassword, hash);

		expect(isValid).toBe(true);
	});

	it('should reject incorrect password', async () => {
		const rawPassword = 'CorrectPassword@123';
		const hash = await hashPassword(rawPassword);
		const isValid = await verifyPassword('WrongPassword@999', hash);

		expect(isValid).toBe(false);
	});

	it('should produce different hashes for identical passwords due to salting', async () => {
		const password = 'SamePasswordEverytime!1';
		const hash1 = await hashPassword(password);
		const hash2 = await hashPassword(password);

		expect(hash1).not.toBe(hash2);
	});
});
