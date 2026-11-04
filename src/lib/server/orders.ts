export const ORDER_STATUSES = [
	'PENDING',
	'PRESCRIPTION_REQUIRED',
	'UNDER_VERIFICATION',
	'APPROVED',
	'REJECTED',
	'CONFIRMED',
	'PACKED',
	'OUT_FOR_DELIVERY',
	'DELIVERED',
	'PICKED_UP',
	'CANCELLED',
	'REFUNDED'
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
	return (ORDER_STATUSES as readonly string[]).includes(value);
}

export const ADMIN_ROLES = ['SUPER_ADMIN', 'PHARMACY_ADMIN', 'PHARMACIST'] as const;

export function isAdminRole(role: string | undefined | null) {
	return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}
