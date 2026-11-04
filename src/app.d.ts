// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				email: string;
				fullName: string;
				phone?: string | null;
				role: 'SUPER_ADMIN' | 'PHARMACY_ADMIN' | 'PHARMACIST' | 'DOCTOR' | 'CUSTOMER' | 'DELIVERY';
				isEmailVerified: boolean;
				ageVerified: boolean;
			} | null;
			sessionId: string | null;
		}
		interface PageData {
			user?: Locals['user'];
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
