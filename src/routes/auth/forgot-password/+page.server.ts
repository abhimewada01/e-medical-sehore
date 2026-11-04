import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());
		const email = String(formData.email ?? '').trim();
		if (!email) return fail(400, { error: 'Please enter your email address' });
		return fail(503, { error: 'Password reset email is not configured yet. Please contact the pharmacy administrator.' });
	}
};
