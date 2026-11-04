import { db } from '../db';
import { medicines, inventoryTransactions } from '../db/schema';
import { eq } from 'drizzle-orm';

export function applyStockChange(current: number, quantityChange: number) {
	const newQty = current + quantityChange;
	if (newQty < 0) throw new Error('Insufficient stock');
	return newQty;
}

export async function adjustInventory(
	medicineId: string,
	quantityChange: number,
	type: string,
	referenceId?: string,
	notes?: string,
	createdBy?: string
) {
	return db.transaction(async (tx) => {
		const [med] = await tx
			.select({ stock: medicines.stockQuantity })
			.from(medicines)
			.where(eq(medicines.id, medicineId))
			.for('update');
		if (!med) throw new Error('Medicine not found');
		const newQty = applyStockChange(med.stock, quantityChange);
		await tx
			.update(medicines)
			.set({ stockQuantity: newQty, updatedAt: new Date() })
			.where(eq(medicines.id, medicineId));
		await tx.insert(inventoryTransactions).values({
			medicineId,
			type,
			quantityChange,
			previousQuantity: med.stock,
			newQuantity: newQty,
			referenceId,
			notes,
			createdBy
		});
		return newQty;
	});
}
