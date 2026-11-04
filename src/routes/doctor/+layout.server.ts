import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/auth/login');
	if (locals.user.role !== 'DOCTOR') {
		if (['SUPER_ADMIN','PHARMACY_ADMIN','PHARMACIST'].includes(locals.user.role)) redirect(302, '/admin/dashboard');
		redirect(302, '/customer/dashboard');
	}
	return { user: locals.user };
};
