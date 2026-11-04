import { db } from '$lib/server/db';
import { doctors, doctorReferralEvents, orders } from '$lib/server/db/schema';
import { eq, count, and, inArray } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import QRCode from 'qrcode';
import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const [doctor] = await db.select({
		id: doctors.id,
		specialization: doctors.specialization,
		clinicName: doctors.clinicName,
		verificationStatus: doctors.verificationStatus,
		referralCode: doctors.referralCode,
		qualification: doctors.qualification,
		licenseNumber: doctors.licenseNumber,
		phone: doctors.phone
	}).from(doctors).where(eq(doctors.userId, userId)).limit(1);
	if (!doctor) error(404, 'Doctor profile not found');

	const [
		totalScans,
		registeredCustomers,
		orderedCustomers,
		totalOrders,
		completedOrders,
		pendingOrders,
		cancelledOrders
	] = await Promise.all([
		db.select({ count: count() }).from(doctorReferralEvents)
			.where(and(eq(doctorReferralEvents.doctorId, doctor.id), eq(doctorReferralEvents.eventType, 'QR_SCAN')))
			.then(r => r[0].count),
		db.select({ customerId: doctorReferralEvents.customerId }).from(doctorReferralEvents)
			.where(and(eq(doctorReferralEvents.doctorId, doctor.id), eq(doctorReferralEvents.eventType, 'REGISTRATION'))),
		db.select({ customerId: orders.customerId }).from(orders).where(eq(orders.doctorId, doctor.id)),
		db.select({ count: count() }).from(orders).where(eq(orders.doctorId, doctor.id)).then(r => r[0].count),
		db.select({ count: count() }).from(orders)
			.where(and(eq(orders.doctorId, doctor.id), inArray(orders.status, ['DELIVERED', 'PICKED_UP']))).then(r => r[0].count),
		db.select({ count: count() }).from(orders)
			.where(and(eq(orders.doctorId, doctor.id), eq(orders.status, 'PENDING'))).then(r => r[0].count),
		db.select({ count: count() }).from(orders)
			.where(and(eq(orders.doctorId, doctor.id), eq(orders.status, 'CANCELLED'))).then(r => r[0].count)
	]);
	const totalPatients = new Set([
		...registeredCustomers.map((row) => row.customerId),
		...orderedCustomers.map((row) => row.customerId)
	].filter((customerId): customerId is string => !!customerId)).size;

	const appUrl = env.PUBLIC_APP_URL ?? 'http://localhost:5173';
	const referralUrl = `${appUrl}/refer/${doctor.referralCode}`;
	const qrCodeDataUrl = await QRCode.toDataURL(referralUrl, {
		width: 300,
		margin: 2,
		color: { dark: '#059669', light: '#ffffff' }
	});

	return {
		doctor,
		referralUrl,
		qrCodeDataUrl,
		stats: {
			totalScans: Number(totalScans),
			totalRegistrations: totalPatients,
			totalOrders: Number(totalOrders),
			completedOrders: Number(completedOrders),
			pendingOrders: Number(pendingOrders),
			cancelledOrders: Number(cancelledOrders)
		}
	};
};
