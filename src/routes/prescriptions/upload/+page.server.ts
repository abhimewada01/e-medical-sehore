import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/auth/login?redirect=/customer/prescriptions');
	}
	redirect(302, '/customer/prescriptions');
};
