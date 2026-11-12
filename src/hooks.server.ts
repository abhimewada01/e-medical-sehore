import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session');
	if (token) {
		const result = await validateSession(token).catch(() => null);
		if (result) {
			event.locals.user = {
				id: result.user.id,
				email: result.user.email,
				fullName: result.user.fullName,
				phone: result.user.phone,
				role: result.user.role as NonNullable<App.Locals['user']>['role'],
				isEmailVerified: result.user.isEmailVerified,
				ageVerified: result.user.ageVerified
			};
			event.locals.sessionId = result.session.id;
		} else {
			event.cookies.delete('session', { path: '/' });
			event.locals.user = null;
			event.locals.sessionId = null;
		}
	} else {
		event.locals.user = null;
		event.locals.sessionId = null;
	}

	const { pathname } = event.url;
	// Older builds linked SUPER_ADMIN accounts to /super_admin/dashboard, but
	// the admin portal now lives under /admin. Normalize all legacy URLs before
	// route resolution so bookmarks and already-open links keep working.
	if (pathname === '/super_admin' || pathname.startsWith('/super_admin/')) {
		const suffix = pathname.slice('/super_admin'.length);
		redirect(302, `/admin${suffix}${event.url.search}`);
	}
	const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
	const isDoctorPath = pathname === '/doctor' || pathname.startsWith('/doctor/');
	const isCustomerPath = pathname === '/customer' || pathname.startsWith('/customer/');
	const isAdminApiPath = pathname === '/api/admin' || pathname.startsWith('/api/admin/');
	const protectedPath = isAdminPath || isDoctorPath || isCustomerPath || isAdminApiPath;
	if (protectedPath && !event.locals.user) redirect(303, '/auth/login');
	const role = event.locals.user?.role;
	const adminRoles = ['SUPER_ADMIN', 'PHARMACY_ADMIN', 'PHARMACIST'];
	if ((isAdminPath || isAdminApiPath) && !adminRoles.includes(role ?? '')) {
		if (event.request.method === 'GET' && isAdminPath) redirect(303, '/auth/access-denied?area=admin');
		return new Response('Forbidden', { status: 403 });
	}
	if (isDoctorPath && role !== 'DOCTOR') {
		if (event.request.method === 'GET') redirect(303, '/auth/access-denied?area=doctor');
		return new Response('Forbidden', { status: 403 });
	}
	if (isCustomerPath && role !== 'CUSTOMER') {
		if (event.request.method === 'GET') redirect(303, '/auth/access-denied?area=customer');
		return new Response('Forbidden', { status: 403 });
	}
	return resolve(event);
};
