import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { orders, orderItems, medicines, customerAddresses, loyaltyWallets, loyaltyTransactions, inventoryTransactions, notifications, adminSettings, doctors, doctorReferralEvents, prescriptions } from '$lib/server/db/schema';
import { and, eq, inArray, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { randomBytes } from 'crypto';

const checkoutSchema = z.object({
	addressId: z.string().optional().default(''),
	fulfillmentType: z.enum(['DELIVERY', 'PICKUP']).default('DELIVERY'),
	paymentMethod: z.enum(['RAZORPAY', 'COD']),
	cartJson: z.string().min(2),
	prescriptionId: z.string().uuid().optional().or(z.literal('')),
	redeemCoins: z.coerce.number().int().min(0).default(0),
	discreetPackaging: z.coerce.boolean().default(false)
});

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/auth/login?redirect=%2Fcheckout');

	const [addresses, wallet, customerPrescriptions] = await Promise.all([
		db.select().from(customerAddresses).where(eq(customerAddresses.userId, locals.user.id)),
		db.select().from(loyaltyWallets).where(eq(loyaltyWallets.userId, locals.user.id)).then(r => r[0] ?? null),
		db.select({
			id: prescriptions.id,
			originalFilename: prescriptions.originalFilename,
			status: prescriptions.status,
			createdAt: prescriptions.createdAt,
			orderId: prescriptions.orderId
		}).from(prescriptions).where(eq(prescriptions.customerId, locals.user.id))
	]);

	const razorpayKeyId = process.env.RAZORPAY_KEY_ID ?? '';

	return { addresses, wallet, prescriptions: customerPrescriptions, razorpayKeyId };
};

export const actions: Actions = {
	placeOrder: async ({ request, locals, cookies }) => {
		if (!locals.user) redirect(302, '/auth/login');

		const formData = Object.fromEntries(await request.formData());
		const result = checkoutSchema.safeParse(formData);
		if (!result.success) {
			return fail(400, { error: result.error.flatten().fieldErrors });
		}

		const { addressId, fulfillmentType, paymentMethod, cartJson, redeemCoins, discreetPackaging, prescriptionId } = result.data;

		let rawCart: unknown;
		try {
			rawCart = JSON.parse(cartJson);
		} catch {
			return fail(400, { error: 'Invalid cart data' });
		}
		const parsedCart = z.record(z.string().uuid(), z.object({ qty: z.number().int().min(1).max(100) }).passthrough()).safeParse(rawCart);
		if (!parsedCart.success) return fail(400, { error: 'Cart contains invalid items or quantities' });
		const cartItems = parsedCart.data;

		const medicineIds = Object.keys(cartItems);
		if (medicineIds.length === 0) return fail(400, { error: 'Cart is empty' });

		let address = null;
		if (fulfillmentType === 'DELIVERY') {
			if (!z.string().uuid().safeParse(addressId).success) return fail(400, { error: 'Choose a delivery address' });
			const [savedAddress] = await db.select().from(customerAddresses).where(eq(customerAddresses.id, addressId));
			if (!savedAddress || savedAddress.userId !== locals.user.id) return fail(400, { error: 'Invalid address' });
			address = savedAddress;
		}

		const medsFromDb = await db.select({
			id: medicines.id,
			name: medicines.name,
			discountedPrice: medicines.discountedPrice,
			price: medicines.price,
			stockQuantity: medicines.stockQuantity,
			isActive: medicines.isActive,
			requiresPrescription: medicines.requiresPrescription,
			isAgeRestricted: medicines.isAgeRestricted
		}).from(medicines).where(inArray(medicines.id, medicineIds));

		const medMap = new Map(medsFromDb.map(m => [m.id, m]));

		// Validate stock
		for (const [id, item] of Object.entries(cartItems)) {
			const med = medMap.get(id);
			if (!med || !med.isActive) return fail(400, { error: 'A medicine in your cart is no longer available' });
			if (med.stockQuantity < item.qty) return fail(400, { error: `Insufficient stock for ${med.name}` });
			if (Number(med.discountedPrice) <= 0 || Number(med.discountedPrice) > Number(med.price)) {
				return fail(400, { error: `The price for ${med.name} needs to be corrected by the pharmacy.` });
			}
		}

		const hasRxItems = medsFromDb.some(m => m.requiresPrescription && cartItems[m.id]);
		const hasAgeRestricted = medsFromDb.some(m => m.isAgeRestricted && cartItems[m.id]);
		let selectedPrescriptionStatus: string | null = null;

		if (hasRxItems) {
			if (!prescriptionId) return fail(400, { error: 'Upload or select a prescription before placing this order.' });
			const [selectedPrescription] = await db.select({
				id: prescriptions.id,
				status: prescriptions.status,
				orderId: prescriptions.orderId
			}).from(prescriptions).where(and(
				eq(prescriptions.id, prescriptionId),
				eq(prescriptions.customerId, locals.user.id)
			)).limit(1);
			if (!selectedPrescription) return fail(400, { error: 'That prescription was not found in your account.' });
			selectedPrescriptionStatus = selectedPrescription.status;
			if (selectedPrescription.status !== 'PENDING_VERIFICATION' && selectedPrescription.status !== 'APPROVED') {
				return fail(400, { error: 'This prescription needs pharmacist approval before it can be used.' });
			}
			if (selectedPrescription.orderId) return fail(400, { error: 'This prescription is already attached to another order. Upload the slip again for a new order.' });
		}

		if (hasAgeRestricted && !locals.user.ageVerified) {
			return fail(400, { error: 'Age verification required for restricted products. Please contact support.' });
		}

		// Get loyalty settings
		const settings = await db.select().from(adminSettings);
		const settingsMap: Record<string, string> = {};
		settings.forEach(s => settingsMap[s.key] = s.value);

		const parsedCoinValue = Number(settingsMap['coin_value_rupees'] ?? '0.1');
		const coinValueRupees = Number.isFinite(parsedCoinValue) && parsedCoinValue > 0 ? parsedCoinValue : 0.1;
		const parsedCoinLimit = Number.parseInt(settingsMap['max_coins_redemption_per_order'] ?? settingsMap['max_coins_per_order'] ?? '50', 10);
		const maxCoinsPerOrder = Number.isFinite(parsedCoinLimit) && parsedCoinLimit > 0 ? parsedCoinLimit : 50;
		let coinsToRedeem = 0;
		let loyaltyDiscount = 0;
		let grandTotal = 0;

		// Calculate totals
		let totalMrp = 0;
		let totalDiscount = 0;
		for (const [id, item] of Object.entries(cartItems)) {
			const med = medMap.get(id)!;
			const originalPrice = Number(med.price) * item.qty;
			const discountedPrice = Number(med.discountedPrice) * item.qty;
			totalMrp += originalPrice;
			totalDiscount += originalPrice - discountedPrice;
		}
		const subtotal = totalMrp - totalDiscount;
		const deliveryFee = fulfillmentType === 'DELIVERY' && subtotal < 500 ? 40 : 0;


		// Determine initial order status
		let status = 'PENDING';
		if (hasRxItems) status = 'PRESCRIPTION_REQUIRED';
		if (hasRxItems && prescriptionId) status = selectedPrescriptionStatus === 'APPROVED' ? 'APPROVED' : 'UNDER_VERIFICATION';

		// Generate order number
		const now = new Date();
		const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
		const randPart = randomBytes(4).toString('hex').toUpperCase();
		const orderNumber = `EMD-${datePart}-${randPart}`;

		const addressSnapshot = address ? {
			recipientName: address.recipientName,
			phone: address.phone,
			addressLine1: address.addressLine1,
			addressLine2: address.addressLine2,
			landmark: address.landmark,
			city: address.city,
			state: address.state,
			postalCode: address.postalCode
		} : { fulfillmentType: 'PICKUP' };

		const referralCode = cookies.get('referral_code');
		const [referringDoctor] = referralCode
			? await db.select({ id: doctors.id, referralCode: doctors.referralCode }).from(doctors)
				.where(eq(doctors.referralCode, referralCode)).limit(1)
			: [];
		const pickupToken = fulfillmentType === 'PICKUP' ? randomBytes(4).toString('hex').toUpperCase() : null;

		// Use DB transaction
		let newOrder: typeof orders.$inferSelect;
		try {
		newOrder = await db.transaction(async (tx) => {
			// Reserve inventory
			for (const [id, item] of Object.entries(cartItems)) {
				const med = medMap.get(id)!;
				const [reserved] = await tx.update(medicines)
					.set({ stockQuantity: sql`${medicines.stockQuantity} - ${item.qty}`, updatedAt: new Date() })
					.where(and(eq(medicines.id, id), eq(medicines.isActive, true), gte(medicines.stockQuantity, item.qty)))
					.returning({ stockQuantity: medicines.stockQuantity });
				if (!reserved) throw new Error(`CHECKOUT_STOCK:${med.name}`);
				const newStock = reserved.stockQuantity;
				const previousStock = newStock + item.qty;
				await tx.insert(inventoryTransactions).values({
					medicineId: id,
					type: 'ORDER_RESERVED',
					quantityChange: -item.qty,
					previousQuantity: previousStock,
					newQuantity: newStock,
					referenceType: 'ORDER',
					referenceId: orderNumber,
					notes: `Reserved for order ${orderNumber}`
				});
			}

			// Lock the wallet and calculate the discount from its current balance.
			if (redeemCoins > 0) {
				const wallet = await tx.select().from(loyaltyWallets)
					.where(eq(loyaltyWallets.userId, locals.user!.id)).for('update').then(r => r[0]);
				if (wallet) {
					coinsToRedeem = Math.min(redeemCoins, maxCoinsPerOrder, wallet.balanceCoins, Math.floor(subtotal / coinValueRupees));
					loyaltyDiscount = coinsToRedeem * coinValueRupees;
					if (coinsToRedeem > 0) {
						await tx.update(loyaltyWallets).set({
							balanceCoins: wallet.balanceCoins - coinsToRedeem,
							totalRedeemedCoins: wallet.totalRedeemedCoins + coinsToRedeem,
							updatedAt: new Date()
						}).where(eq(loyaltyWallets.id, wallet.id));

						await tx.insert(loyaltyTransactions).values({
							walletId: wallet.id,
							type: 'DEBIT_REDEMPTION',
							coins: -coinsToRedeem,
							previousBalance: wallet.balanceCoins,
							newBalance: wallet.balanceCoins - coinsToRedeem,
							referenceNote: `Redeemed ${coinsToRedeem} coins for order ${orderNumber}`
						});
					}
				}
			}
			grandTotal = Math.max(0, subtotal - loyaltyDiscount + deliveryFee);

			// Create order
			const [order] = await tx.insert(orders).values({
				orderNumber,
				customerId: locals.user!.id,
				deliveryAddressId: address?.id ?? null,
				addressSnapshot,
				fulfillmentType,
				pickupToken,
				doctorId: referringDoctor?.id ?? null,
				referralToken: referralCode ?? null,
				status,
				totalMrp: String(totalMrp.toFixed(2)),
				totalDiscount: String(totalDiscount.toFixed(2)),
				loyaltyCoinsRedeemed: coinsToRedeem,
				loyaltyCoinsDiscount: String(loyaltyDiscount.toFixed(2)),
				deliveryFee: String(deliveryFee.toFixed(2)),
				grandTotal: String(grandTotal.toFixed(2)),
				paymentMethod,
				paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
				prescriptionId: prescriptionId || null,
				discreetPackaging,
				isAgeRestrictedOrder: hasAgeRestricted
			}).returning();

			// Create order items
			const itemValues = Object.entries(cartItems).map(([id, item]) => ({
				orderId: order.id,
				medicineId: id,
				medicineName: medMap.get(id)!.name,
				quantity: item.qty,
				unitPrice: String(Number(medMap.get(id)!.discountedPrice).toFixed(2)),
				totalPrice: String((Number(medMap.get(id)!.discountedPrice) * item.qty).toFixed(2)),
				requiresPrescription: medMap.get(id)?.requiresPrescription ?? false
			}));
			await tx.insert(orderItems).values(itemValues);
			if (prescriptionId) {
				await tx.update(prescriptions).set({ orderId: order.id, updatedAt: new Date() })
					.where(and(eq(prescriptions.id, prescriptionId), eq(prescriptions.customerId, locals.user!.id)));
			}

			// Notify customer
			await tx.insert(notifications).values({
				userId: locals.user!.id,
				title: 'Order Placed!',
				message: `Your order ${orderNumber} has been placed. ${hasRxItems ? 'Please wait for prescription verification.' : 'We\'ll confirm your order shortly.'}`,
				type: 'ORDER_STATUS',
				link: `/customer/orders/${order.id}`
			});
			if (referringDoctor) {
				await tx.insert(doctorReferralEvents).values({
					doctorId: referringDoctor.id,
					referralCode: referringDoctor.referralCode,
					eventType: 'ORDER_PLACED',
					customerId: locals.user!.id,
					orderId: order.id
				});
			}

			return order;
		});
		} catch (cause) {
			const message = cause instanceof Error ? cause.message : '';
			if (message.startsWith('CHECKOUT_STOCK:')) return fail(409, { error: `Stock changed while ordering ${message.slice('CHECKOUT_STOCK:'.length)}. Please refresh your cart.` });
			throw cause;
		}
		if (referringDoctor) cookies.delete('referral_code', { path: '/' });

		redirect(302, `/customer/orders/${newOrder.id}?placed=1`);
	}
};
