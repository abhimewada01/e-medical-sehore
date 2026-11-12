import { redirect } from '@sveltejs/kit';

/** Keep older super-admin links working with the current admin route structure. */
export function load() {
	redirect(302, '/admin/dashboard');
}
