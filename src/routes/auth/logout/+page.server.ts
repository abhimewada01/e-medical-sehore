import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { deleteSession } from '$lib/server/auth/session';

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		if (locals.sessionId) {
			await deleteSession(locals.sessionId).catch(() => {});
		}
		cookies.delete('session', { path: '/' });
		redirect(302, '/auth/login');
	}
};
