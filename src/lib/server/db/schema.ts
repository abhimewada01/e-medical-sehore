import {
	pgTable,
	uuid,
	text,
	varchar,
	integer,
	numeric,
	boolean,
	timestamp,
	jsonb,
	index,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// USER ROLES:
// SUPER_ADMIN, PHARMACY_ADMIN, PHARMACIST, DOCTOR, CUSTOMER, DELIVERY
export const users = pgTable(
	'users',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		email: varchar('email', { length: 255 }).notNull().unique(),
		passwordHash: text('password_hash'),
		role: varchar('role', { length: 32 }).notNull().default('CUSTOMER'),
		fullName: varchar('full_name', { length: 255 }).notNull(),
		phone: varchar('phone', { length: 20 }),
		isEmailVerified: boolean('is_email_verified').default(false).notNull(),
		ageVerified: boolean('age_verified').default(false).notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_users_role').on(t.role),
		index('idx_users_email').on(t.email)
	]
);

export const userSessions = pgTable(
	'user_sessions',
	{
		id: varchar('id', { length: 128 }).primaryKey(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		ipAddress: varchar('ip_address', { length: 64 }),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('idx_sessions_user').on(t.userId)]
);

export const customerProfiles = pgTable('customer_profiles', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull()
		.unique(),
	dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
	gender: varchar('gender', { length: 20 }),
	emergencyContact: varchar('emergency_contact', { length: 20 }),
	allergyNotes: text('allergy_notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const customerAddresses = pgTable(
	'customer_addresses',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		recipientName: varchar('recipient_name', { length: 255 }).notNull(),
		phone: varchar('phone', { length: 20 }).notNull(),
		addressLine1: text('address_line1').notNull(),
		addressLine2: text('address_line2'),
		landmark: varchar('landmark', { length: 255 }),
		city: varchar('city', { length: 100 }).notNull().default('Sehore'),
		state: varchar('state', { length: 100 }).notNull().default('Madhya Pradesh'),
		postalCode: varchar('postal_code', { length: 10 }).notNull().default('466001'),
		isDefault: boolean('is_default').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('idx_addresses_user').on(t.userId)]
);

export const doctors = pgTable(
	'doctors',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull()
			.unique(),
		licenseNumber: varchar('license_number', { length: 100 }).notNull().unique(),
		qualification: varchar('qualification', { length: 255 }).notNull(),
		specialization: varchar('specialization', { length: 255 }).notNull(),
		clinicName: varchar('clinic_name', { length: 255 }).notNull(),
		clinicAddress: text('clinic_address').notNull(),
		phone: varchar('phone', { length: 20 }).notNull(),
		referralCode: varchar('referral_code', { length: 50 }).notNull().unique(), // e.g. DOC-SEHORE-101
		qrCodeDataUrl: text('qr_code_data_url'),
		verificationStatus: varchar('verification_status', { length: 32 })
			.default('PENDING')
			.notNull(), // PENDING, VERIFIED, REJECTED
		bio: text('bio'),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_doctors_referral_code').on(t.referralCode),
		index('idx_doctors_status').on(t.verificationStatus)
	]
);

export const doctorReferrals = pgTable(
	'doctor_referrals',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		doctorId: uuid('doctor_id')
			.references(() => doctors.id, { onDelete: 'cascade' })
			.notNull(),
		customerId: uuid('customer_id').references(() => users.id, { onDelete: 'cascade' }),
		referralToken: varchar('referral_token', { length: 64 }).notNull().unique(),
		status: varchar('status', { length: 32 }).default('ACTIVE').notNull(), // ACTIVE, USED, EXPIRED
		attributionSource: varchar('attribution_source', { length: 64 }).default('QR_SCAN').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_doctor_referrals_doc').on(t.doctorId),
		index('idx_doctor_referrals_token').on(t.referralToken)
	]
);

export const doctorReferralEvents = pgTable(
	'doctor_referral_events',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		doctorId: uuid('doctor_id')
			.references(() => doctors.id, { onDelete: 'cascade' })
			.notNull(),
		referralCode: varchar('referral_code', { length: 50 }).notNull(),
		eventType: varchar('event_type', { length: 32 }).notNull(), // QR_SCAN, REGISTRATION, ORDER_PLACED, ORDER_COMPLETED, ORDER_CANCELLED
		customerId: uuid('customer_id').references(() => users.id, { onDelete: 'set null' }),
		orderId: uuid('order_id'),
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_referral_events_doc').on(t.doctorId),
		index('idx_referral_events_type').on(t.eventType)
	]
);

export const medicineCategories = pgTable('medicine_categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: varchar('name', { length: 150 }).notNull(),
	slug: varchar('slug', { length: 150 }).notNull().unique(),
	description: text('description'),
	iconName: varchar('icon_name', { length: 50 }).default('Pill'),
	isAgeRestricted: boolean('is_age_restricted').default(false).notNull(), // 18+ category (condoms, sexual wellness)
	sortOrder: integer('sort_order').default(0).notNull(),
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const medicines = pgTable(
	'medicines',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		name: varchar('name', { length: 255 }).notNull(),
		genericName: varchar('generic_name', { length: 255 }),
		brandName: varchar('brand_name', { length: 255 }),
		categoryId: uuid('category_id')
			.references(() => medicineCategories.id, { onDelete: 'restrict' })
			.notNull(),
		description: text('description'),
		dosageForm: varchar('dosage_form', { length: 100 }).notNull().default('Tablet'), // Tablet, Syrup, Capsule, Cream, Injection, Device, etc.
		strength: varchar('strength', { length: 100 }), // e.g. 500mg, 100ml
		packSize: varchar('pack_size', { length: 100 }), // e.g. 10 Tablets / Strip
		price: numeric('price', { precision: 10, scale: 2 }).notNull(),
		discountedPrice: numeric('discounted_price', { precision: 10, scale: 2 }).notNull(),
		stockQuantity: integer('stock_quantity').default(0).notNull(),
		minStockAlert: integer('min_stock_alert').default(10).notNull(),
		requiresPrescription: boolean('requires_prescription').default(false).notNull(),
		isAgeRestricted: boolean('is_age_restricted').default(false).notNull(), // e.g. Sexual wellness 18+
		manufacturer: varchar('manufacturer', { length: 255 }),
		composition: text('composition'), // Salt / chemical formulation
		sideEffects: text('side_effects'),
		usageInstructions: text('usage_instructions'),
		storageInstructions: text('storage_instructions'),
		imageUrl: text('image_url'),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_medicines_category').on(t.categoryId),
		index('idx_medicines_name').on(t.name),
		index('idx_medicines_generic').on(t.genericName),
		index('idx_medicines_active').on(t.isActive)
	]
);

export const medicineBatches = pgTable(
	'medicine_batches',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		medicineId: uuid('medicine_id')
			.references(() => medicines.id, { onDelete: 'cascade' })
			.notNull(),
		batchNumber: varchar('batch_number', { length: 100 }).notNull(),
		expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
		manufacturingDate: timestamp('manufacturing_date', { withTimezone: true }),
		mrp: numeric('mrp', { precision: 10, scale: 2 }).notNull(),
		purchaseRate: numeric('purchase_rate', { precision: 10, scale: 2 }),
		quantity: integer('quantity').notNull(),
		availableQuantity: integer('available_quantity').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_batches_medicine').on(t.medicineId),
		index('idx_batches_expiry').on(t.expiryDate)
	]
);

export const inventoryTransactions = pgTable(
	'inventory_transactions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		medicineId: uuid('medicine_id')
			.references(() => medicines.id, { onDelete: 'cascade' })
			.notNull(),
		batchId: uuid('batch_id').references(() => medicineBatches.id, { onDelete: 'set null' }),
		type: varchar('type', { length: 50 }).notNull(), // RESTOCK, ORDER_RESERVED, ORDER_DISPENSED, ORDER_CANCELLED_RESTORE, EXPIRED_SCRAP, AUDIT_ADJUSTMENT
		quantityChange: integer('quantity_change').notNull(),
		previousQuantity: integer('previous_quantity').notNull(),
		newQuantity: integer('new_quantity').notNull(),
		referenceType: varchar('reference_type', { length: 50 }), // ORDER, MANUAL, BATCH
		referenceId: varchar('reference_id', { length: 100 }),
		notes: text('notes'),
		createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('idx_inventory_med').on(t.medicineId)]
);

export const prescriptions = pgTable(
	'prescriptions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		customerId: uuid('customer_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		fileUrl: text('file_url').notNull(),
		originalFilename: varchar('original_filename', { length: 255 }).notNull(),
		mimeType: varchar('mime_type', { length: 100 }).notNull(),
		fileSize: integer('file_size').notNull(),
		extractedText: text('extracted_text'),
		status: varchar('status', { length: 32 }).default('PENDING_VERIFICATION').notNull(), // PENDING_VERIFICATION, APPROVED, REJECTED, CLARIFICATION_REQUESTED
		verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'set null' }),
		verifiedAt: timestamp('verified_at', { withTimezone: true }),
		rejectionReason: text('rejection_reason'),
		pharmacistNotes: text('pharmacist_notes'),
		orderId: uuid('order_id'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_prescriptions_customer').on(t.customerId),
		index('idx_prescriptions_status').on(t.status)
	]
);

export const orders = pgTable(
	'orders',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		orderNumber: varchar('order_number', { length: 64 }).notNull().unique(), // e.g. EMD-20261104-A1B2
		customerId: uuid('customer_id')
			.references(() => users.id, { onDelete: 'restrict' })
			.notNull(),
		deliveryAddressId: uuid('delivery_address_id').references(() => customerAddresses.id, {
			onDelete: 'set null'
		}),
		addressSnapshot: jsonb('address_snapshot').notNull(),
		doctorId: uuid('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
		referralToken: varchar('referral_token', { length: 64 }),
		fulfillmentType: varchar('fulfillment_type', { length: 20 }).default('DELIVERY').notNull(), // DELIVERY, PICKUP
		pickupToken: varchar('pickup_token', { length: 12 }),
		status: varchar('status', { length: 32 }).default('PENDING').notNull(),
		// Statuses: PENDING, PRESCRIPTION_REQUIRED, UNDER_VERIFICATION, APPROVED, REJECTED, CONFIRMED, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, REFUNDED
		totalMrp: numeric('total_mrp', { precision: 10, scale: 2 }).notNull(),
		totalDiscount: numeric('total_discount', { precision: 10, scale: 2 }).default('0.00').notNull(),
		loyaltyCoinsRedeemed: integer('loyalty_coins_redeemed').default(0).notNull(),
		loyaltyCoinsDiscount: numeric('loyalty_coins_discount', { precision: 10, scale: 2 })
			.default('0.00')
			.notNull(),
		deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).default('0.00').notNull(),
		grandTotal: numeric('grand_total', { precision: 10, scale: 2 }).notNull(),
		paymentMethod: varchar('payment_method', { length: 32 }).notNull(), // RAZORPAY, COD
		paymentStatus: varchar('payment_status', { length: 32 }).default('PENDING').notNull(), // PENDING, PAID, FAILED, REFUNDED
		isAgeRestrictedOrder: boolean('is_age_restricted_order').default(false).notNull(),
		discreetPackaging: boolean('discreet_packaging').default(false).notNull(),
		assignedDeliveryPersonnelId: uuid('assigned_delivery_personnel_id').references(() => users.id, {
			onDelete: 'set null'
		}),
		notes: text('notes'),
		prescriptionId: uuid('prescription_id').references(() => prescriptions.id, {
			onDelete: 'set null'
		}),
		deliveredAt: timestamp('delivered_at', { withTimezone: true }),
		cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_orders_customer').on(t.customerId),
		index('idx_orders_status').on(t.status),
		index('idx_orders_doctor').on(t.doctorId),
		index('idx_orders_created').on(t.createdAt),
		uniqueIndex('orders_pickup_token_unique').on(t.pickupToken)
	]
);

export const orderItems = pgTable(
	'order_items',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		orderId: uuid('order_id')
			.references(() => orders.id, { onDelete: 'cascade' })
			.notNull(),
		medicineId: uuid('medicine_id')
			.references(() => medicines.id, { onDelete: 'restrict' })
			.notNull(),
		batchId: uuid('batch_id').references(() => medicineBatches.id, { onDelete: 'set null' }),
		medicineName: varchar('medicine_name', { length: 255 }).notNull(),
		quantity: integer('quantity').notNull(),
		unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
		totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
		requiresPrescription: boolean('requires_prescription').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('idx_order_items_order').on(t.orderId)]
);

export const payments = pgTable(
	'payments',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		orderId: uuid('order_id')
			.references(() => orders.id, { onDelete: 'cascade' })
			.notNull(),
		paymentMethod: varchar('payment_method', { length: 32 }).notNull(), // RAZORPAY, COD
		razorpayOrderId: varchar('razorpay_order_id', { length: 100 }),
		razorpayPaymentId: varchar('razorpay_payment_id', { length: 100 }),
		razorpaySignature: text('razorpay_signature'),
		amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
		currency: varchar('currency', { length: 10 }).default('INR').notNull(),
		status: varchar('status', { length: 32 }).default('PENDING').notNull(), // PENDING, SUCCESS, FAILED, REFUNDED
		refundId: varchar('refund_id', { length: 100 }),
		refundAmount: numeric('refund_amount', { precision: 10, scale: 2 }),
		metadata: jsonb('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_payments_order').on(t.orderId),
		index('idx_payments_razorpay_order').on(t.razorpayOrderId)
	]
);

export const paymentWebhooks = pgTable('payment_webhooks', {
	id: uuid('id').defaultRandom().primaryKey(),
	eventId: varchar('event_id', { length: 100 }),
	eventType: varchar('event_type', { length: 100 }).notNull(),
	payload: jsonb('payload').notNull(),
	signature: text('signature'),
	processed: boolean('processed').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const deliveries = pgTable(
	'deliveries',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		orderId: uuid('order_id')
			.references(() => orders.id, { onDelete: 'cascade' })
			.notNull()
			.unique(),
		deliveryAgentId: uuid('delivery_agent_id').references(() => users.id, {
			onDelete: 'set null'
		}),
		trackingNumber: varchar('tracking_number', { length: 100 }).notNull().unique(),
		status: varchar('status', { length: 32 }).default('ASSIGNED').notNull(), // ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED_ATTEMPT
		estimatedDelivery: timestamp('estimated_delivery', { withTimezone: true }),
		actualDelivery: timestamp('actual_delivery', { withTimezone: true }),
		recipientSignatureUrl: text('recipient_signature_url'),
		failureReason: text('failure_reason'),
		otpCode: varchar('otp_code', { length: 10 }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [index('idx_deliveries_order').on(t.orderId)]
);

export const loyaltyWallets = pgTable('loyalty_wallets', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull()
		.unique(),
	balanceCoins: integer('balance_coins').default(0).notNull(),
	totalEarnedCoins: integer('total_earned_coins').default(0).notNull(),
	totalRedeemedCoins: integer('total_redeemed_coins').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const loyaltyTransactions = pgTable(
	'loyalty_transactions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		walletId: uuid('wallet_id')
			.references(() => loyaltyWallets.id, { onDelete: 'cascade' })
			.notNull(),
		orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
		type: varchar('type', { length: 32 }).notNull(), // CREDIT_ORDER, DEBIT_REDEMPTION, REVERSAL_REFUND, EXPIRY_DEBIT, ADMIN_ADJUSTMENT
		coins: integer('coins').notNull(),
		previousBalance: integer('previous_balance').notNull(),
		newBalance: integer('new_balance').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }), // 30 days default
		isExpired: boolean('is_expired').default(false).notNull(),
		referenceNote: text('reference_note'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_loyalty_tx_wallet').on(t.walletId),
		index('idx_loyalty_tx_order').on(t.orderId)
	]
);

export const notifications = pgTable(
	'notifications',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		title: varchar('title', { length: 255 }).notNull(),
		message: text('message').notNull(),
		type: varchar('type', { length: 32 }).notNull(), // ORDER_STATUS, PRESCRIPTION_UPDATE, REWARD_EARNED, REWARD_EXPIRING, INVENTORY_ALERT, DOCTOR_REFERRAL, SYSTEM
		link: text('link'),
		isRead: boolean('is_read').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_notifications_user').on(t.userId),
		index('idx_notifications_read').on(t.isRead)
	]
);

export const adminSettings = pgTable('admin_settings', {
	id: uuid('id').defaultRandom().primaryKey(),
	key: varchar('key', { length: 100 }).notNull().unique(),
	value: text('value').notNull(),
	description: text('description'),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const auditLogs = pgTable(
	'audit_logs',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
		actorRole: varchar('actor_role', { length: 32 }),
		action: varchar('action', { length: 100 }).notNull(),
		entityType: varchar('entity_type', { length: 100 }).notNull(),
		entityId: varchar('entity_id', { length: 100 }),
		ipAddress: varchar('ip_address', { length: 64 }),
		userAgent: text('user_agent'),
		details: jsonb('details'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_audit_logs_actor').on(t.actorId),
		index('idx_audit_logs_action').on(t.action)
	]
);

// Drizzle relations for intuitive querying
export const usersRelations = relations(users, ({ one, many }) => ({
	profile: one(customerProfiles, {
		fields: [users.id],
		references: [customerProfiles.userId]
	}),
	addresses: many(customerAddresses),
	doctorProfile: one(doctors, {
		fields: [users.id],
		references: [doctors.userId]
	}),
	orders: many(orders),
	prescriptions: many(prescriptions),
	wallet: one(loyaltyWallets, {
		fields: [users.id],
		references: [loyaltyWallets.userId]
	}),
	notifications: many(notifications)
}));

export const medicinesRelations = relations(medicines, ({ one, many }) => ({
	category: one(medicineCategories, {
		fields: [medicines.categoryId],
		references: [medicineCategories.id]
	}),
	batches: many(medicineBatches),
	inventoryTransactions: many(inventoryTransactions)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
	customer: one(users, {
		fields: [orders.customerId],
		references: [users.id]
	}),
	doctor: one(doctors, {
		fields: [orders.doctorId],
		references: [doctors.id]
	}),
	prescription: one(prescriptions, {
		fields: [orders.prescriptionId],
		references: [prescriptions.id]
	}),
	items: many(orderItems),
	payments: many(payments),
	delivery: one(deliveries, {
		fields: [orders.id],
		references: [deliveries.orderId]
	})
}));
