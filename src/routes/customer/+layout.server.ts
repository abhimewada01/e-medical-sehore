import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/auth/login');
	if (locals.user.role !== 'CUSTOMER') {
		if (locals.user.role === 'SUPER_ADMIN' || locals.user.role === 'PHARMACY_ADMIN' || locals.user.role === 'PHARMACIST') {
			redirect(302, '/admin/dashboard');
		} else if (locals.user.role === 'DOCTOR') {
			redirect(302, '/doctor/dashboard');
		}
	}
	return { user: locals.user };
};
