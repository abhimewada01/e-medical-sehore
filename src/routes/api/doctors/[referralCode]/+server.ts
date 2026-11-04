import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { doctors, doctorReferralEvents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const [doctor] = await db.select({
		id: doctors.id,
		referralCode: doctors.referralCode,
		clinicName: doctors.clinicName,
		specialization: doctors.specialization,
		isActive: doctors.isActive,
		verificationStatus: doctors.verificationStatus
	}).from(doctors).where(eq(doctors.referralCode, params.referralCode)).limit(1);

	if (!doctor || !doctor.isActive) error(404, 'Doctor not found');
	return json(doctor);
};
