<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { ArrowLeft, Package, User, MapPin, CreditCard, Truck, FileText, CheckCircle } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let { order, items, customer, prescription, delivery, deliveryAgents } = $derived(data);
	let addr = $derived(order.addressSnapshot as any);

	const ORDER_STATUSES = [
		'PENDING', 'PRESCRIPTION_REQUIRED', 'UNDER_VERIFICATION', 'APPROVED',
		'REJECTED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PICKED_UP', 'CANCELLED', 'REFUNDED'
	];
</script>

<svelte:head>
	<title>Admin - Order {order.orderNumber}</title>
</svelte:head>

<div class="p-6 max-w-5xl">
	<div class="flex items-center gap-3 mb-6">
		<a href="/admin/orders" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
			<ArrowLeft size={20} />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Order {order.orderNumber}</h1>
			<p class="text-xs text-gray-500">Placed on {new Date(order.createdAt).toLocaleString('en-IN')}</p>
		</div>
	</div>

	{#if form?.success}
		<div class="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
			Updated successfully!
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 space-y-6">
			<!-- Order Items -->
			<div class="bg-white rounded-2xl border border-gray-100 p-5">
				<h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
					<Package size={18} class="text-purple-600" /> Order Items ({items.length})
				</h2>
				<div class="divide-y divide-gray-100">
					{#each items as item}
						<div class="py-3 flex items-center justify-between">
							<div>
								<div class="font-medium text-gray-800 text-sm">{item.medicineName}</div>
								<div class="text-xs text-gray-400">Qty: {item.quantity} × ₹{Number(item.unitPrice).toFixed(2)}</div>
								{#if item.requiresPrescription}
									<span class="inline-block mt-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Rx Required</span>
								{/if}
							</div>
							<div class="font-semibold text-purple-700">₹{Number(item.totalPrice).toFixed(2)}</div>
						</div>
					{/each}
				</div>
				<div class="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
					<div class="flex justify-between text-gray-600"><span>MRP Total</span><span>₹{Number(order.totalMrp).toFixed(2)}</span></div>
					<div class="flex justify-between text-green-600"><span>Discount</span><span>-₹{Number(order.totalDiscount).toFixed(2)}</span></div>
					{#if Number(order.loyaltyCoinsDiscount) > 0}
						<div class="flex justify-between text-purple-600"><span>Loyalty Discount ({order.loyaltyCoinsRedeemed} coins)</span><span>-₹{Number(order.loyaltyCoinsDiscount).toFixed(2)}</span></div>
					{/if}
					<div class="flex justify-between text-gray-600"><span>Delivery Fee</span><span>₹{Number(order.deliveryFee).toFixed(2)}</span></div>
					<div class="flex justify-between text-base font-bold text-gray-800 pt-2 border-t border-gray-100">
						<span>Grand Total</span><span class="text-purple-700">₹{Number(order.grandTotal).toFixed(2)}</span>
					</div>
				</div>
			</div>

			<!-- Prescription Section if attached -->
			{#if prescription}
				<div class="bg-white rounded-2xl border border-gray-100 p-5">
					<h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
						<FileText size={18} class="text-orange-500" /> Attached Prescription
					</h2>
					<div class="flex items-center justify-between">
						<div>
							<div class="text-sm font-medium text-gray-800">{prescription.originalFilename}</div>
							<div class="text-xs text-gray-500">Status: <span class="font-semibold">{prescription.status}</span></div>
						</div>
						<a href={`/api/prescriptions/${prescription.id}`} target="_blank" rel="noreferrer" class="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 font-medium">
							View Prescription
						</a>
					</div>
				</div>
			{/if}

			<!-- Delivery Address & Customer details -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="bg-white rounded-2xl border border-gray-100 p-5">
					<h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
						<User size={18} class="text-blue-600" /> Customer
					</h2>
					<div class="text-sm space-y-1 text-gray-600">
						<div class="font-semibold text-gray-800">{customer?.fullName}</div>
						<div>{customer?.email}</div>
						<div>{customer?.phone ?? 'No phone provided'}</div>
					</div>
				</div>
				<div class="bg-white rounded-2xl border border-gray-100 p-5">
					<h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
						<MapPin size={18} class="text-purple-600" /> {order.fulfillmentType === 'PICKUP' ? 'Store pickup' : 'Delivery Address'}
					</h2>
					{#if order.fulfillmentType === 'PICKUP'}
						<div class="text-sm text-gray-600">Pickup token: <strong class="text-purple-700">{order.pickupToken}</strong></div>
					{:else}
					<div class="text-sm space-y-0.5 text-gray-600">
						<div class="font-semibold text-gray-800">{addr?.recipientName}</div>
						<div>{addr?.addressLine1} {addr?.addressLine2 ?? ''}</div>
						{#if addr?.landmark}<div>Landmark: {addr.landmark}</div>{/if}
						<div>{addr?.city}, {addr?.state} - {addr?.postalCode}</div>
						<div>Phone: {addr?.phone}</div>
					</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Right Column: Status & Delivery Management -->
		<div class="space-y-6">
			<!-- Update Status -->
			<div class="bg-white rounded-2xl border border-gray-100 p-5">
				<h2 class="font-bold text-gray-800 mb-4">Update Order Status</h2>
				<form method="post" action="?/updateStatus" use:enhance class="space-y-3">
					<select name="status" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
						{#each ORDER_STATUSES as s}
							<option value={s} selected={s === order.status}>{s.replace(/_/g, ' ')}</option>
						{/each}
					</select>
					<button type="submit" class="w-full bg-purple-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">
						Save Status
					</button>
				</form>
			</div>

			<!-- Delivery Assignment -->
			{#if order.fulfillmentType === 'DELIVERY'}
			<div class="bg-white rounded-2xl border border-gray-100 p-5">
				<h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
					<Truck size={18} class="text-indigo-600" /> Assign Delivery
				</h2>
				{#if delivery}
					<div class="mb-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl">
						<div>Tracking: <strong>{delivery.trackingNumber}</strong></div>
						<div>Status: <span class="text-purple-600 font-semibold">{delivery.status}</span></div>
					</div>
				{/if}
				<form method="post" action="?/assignDelivery" use:enhance class="space-y-3">
					<select name="agentId" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500">
						<option value="">Select delivery personnel</option>
						{#each deliveryAgents as agent}
							<option value={agent.id} selected={agent.id === order.assignedDeliveryPersonnelId}>
								{agent.fullName} ({agent.phone ?? 'No phone'})
							</option>
						{/each}
					</select>
					<button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
						Assign Personnel
					</button>
				</form>
			</div>
			{/if}

			<!-- Payment Info -->
			<div class="bg-white rounded-2xl border border-gray-100 p-5 text-sm">
				<h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
					<CreditCard size={18} class="text-purple-600" /> Payment Summary
				</h2>
				<div class="space-y-1 text-gray-600">
					<div class="flex justify-between"><span>Method:</span><span class="font-semibold text-gray-800">{order.paymentMethod}</span></div>
					<div class="flex justify-between"><span>Payment Status:</span><span class="font-semibold {order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600'}">{order.paymentStatus}</span></div>
					<div class="flex justify-between"><span>Discreet Packaging:</span><span>{order.discreetPackaging ? 'Yes' : 'No'}</span></div>
				</div>
			</div>
		</div>
	</div>
</div>
