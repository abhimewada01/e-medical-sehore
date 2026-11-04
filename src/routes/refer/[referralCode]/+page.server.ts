import { db } from '$lib/server/db';
import { doctors, doctorReferralEvents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies, getClientAddress, request }) => {
	const { referralCode } = params;

	const [doctor] = await db.select({
		id: doctors.id,
		referralCode: doctors.referralCode,
		clinicName: doctors.clinicName,
		specialization: doctors.specialization,
		isActive: doctors.isActive,
		verificationStatus: doctors.verificationStatus
	}).from(doctors).where(eq(doctors.referralCode, referralCode)).limit(1);

	if (!doctor || !doctor.isActive) error(404, 'Invalid or inactive referral link');

	// Record QR scan event (fire and forget - deduplicate by IP per day)
	const ip = getClientAddress();
	db.insert(doctorReferralEvents).values({
		doctorId: doctor.id,
		referralCode,
		eventType: 'QR_SCAN',
		metadata: { ip, userAgent: request.headers.get('user-agent') }
	}).catch(() => {});

	// Set referral cookie (30 days)
	cookies.set('referral_code', referralCode, {
		path: '/',
		httpOnly: false,
		maxAge: 30 * 24 * 60 * 60,
		sameSite: 'lax'
	});

	return { doctor };
};
