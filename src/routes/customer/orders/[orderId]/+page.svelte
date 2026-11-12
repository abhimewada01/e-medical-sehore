<script lang="ts">
	import type { PageData } from './$types';
	import { ArrowLeft, Package, FileText, MapPin, CreditCard } from 'lucide-svelte';
	import { page } from '$app/stores';

	let { data }: {  data: PageData  } = $props();
	let { order, items, prescription } = $derived(data);

	const justPlaced = $derived($page.url.searchParams.get('placed') === '1');

	const statusColors: Record<string, string> = {
		PENDING: 'bg-yellow-100 text-yellow-700',
		PRESCRIPTION_REQUIRED: 'bg-orange-100 text-orange-700',
		UNDER_VERIFICATION: 'bg-blue-100 text-blue-700',
		APPROVED: 'bg-teal-100 text-teal-700',
		CONFIRMED: 'bg-indigo-100 text-indigo-700',
		PACKED: 'bg-purple-100 text-purple-700',
		OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
		DELIVERED: 'bg-green-100 text-green-700',
		PICKED_UP: 'bg-green-100 text-green-700',
		CANCELLED: 'bg-red-100 text-red-700',
		REFUNDED: 'bg-gray-100 text-gray-600'
	};

	const statusSteps = $derived(order.fulfillmentType === 'PICKUP'
		? ['CONFIRMED', 'PACKED', 'PICKED_UP']
		: ['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']);
	const currentStepIndex = $derived(statusSteps.indexOf(order.status));
	const addr = $derived(order.addressSnapshot as any);
</script>

<svelte:head>
	<title>Order {order.orderNumber} – E-Medical Sehore</title>
</svelte:head>

<div class="p-6 max-w-3xl mx-auto">
	<div class="flex items-center gap-3 mb-6">
		<a href="/customer/orders" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
			<ArrowLeft size={20} />
		</a>
		<div>
			<h1 class="text-xl font-bold text-gray-800">Order {order.orderNumber}</h1>
			<p class="text-sm text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
		</div>
	</div>

	{#if order.fulfillmentType === 'PICKUP'}
		<div class="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-4">
			<div class="text-sm font-semibold text-purple-900">Medical store pickup</div>
			<div class="text-sm text-purple-800 mt-1">Show this token at the counter after the pharmacy marks your order ready.</div>
			<div class="mt-3 text-3xl tracking-[0.2em] font-bold text-purple-700">{order.pickupToken}</div>
		</div>
	{/if}

	{#if justPlaced}
		<div class="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-green-700 text-sm flex items-center gap-2">
			✅ <span>Your order has been placed successfully! We'll notify you once it's confirmed.</span>
		</div>
	{/if}
	{#if prescription && order.status === 'UNDER_VERIFICATION'}
		<div class="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-blue-800 text-sm">
			<strong>Your prescription and order were sent to the pharmacy.</strong>
			<p class="mt-1">A pharmacist will review the slip before the medicines are prepared. You can follow the review status below.</p>
		</div>
	{/if}

	<!-- Status badge -->
	<div class="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
		<div class="flex items-center justify-between mb-4">
			<span class="text-sm font-medium text-gray-600">Order Status</span>
			<span class="inline-block text-sm font-semibold px-3 py-1 rounded-full {statusColors[order.status] ?? 'bg-gray-100 text-gray-600'}">
				{order.status.replace(/_/g, ' ')}
			</span>
		</div>

		{#if currentStepIndex >= 0}
			<div class="flex items-center gap-2 mt-4">
				{#each statusSteps as step, i}
					<div class="flex items-center gap-2 flex-1">
						<div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 {i <= currentStepIndex ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'}">
							{i + 1}
						</div>
						<div class="text-xs {i <= currentStepIndex ? 'text-purple-700 font-medium' : 'text-gray-400'} hidden sm:block">
							{step.replace(/_/g, ' ')}
						</div>
						{#if i < statusSteps.length - 1}
							<div class="flex-1 h-0.5 {i < currentStepIndex ? 'bg-purple-400' : 'bg-gray-200'}"></div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Items -->
	<div class="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
		<h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2"><Package size={18} class="text-purple-600" /> Items</h2>
		<div class="space-y-3">
			{#each items as item}
				<div class="flex items-center justify-between">
					<div>
						<div class="font-medium text-gray-800 text-sm">{item.medicineName}</div>
						<div class="text-xs text-gray-400">Qty: {item.quantity} × ₹{Number(item.unitPrice).toFixed(2)}</div>
					</div>
					<div class="font-semibold text-purple-700">₹{Number(item.totalPrice).toFixed(2)}</div>
				</div>
			{/each}
		</div>
		<div class="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
			<div class="flex justify-between text-gray-600">
				<span>Subtotal</span><span>₹{(Number(order.totalMrp) - Number(order.totalDiscount)).toFixed(2)}</span>
			</div>
			{#if Number(order.totalDiscount) > 0}
				<div class="flex justify-between text-green-600"><span>Discount</span><span>−₹{Number(order.totalDiscount).toFixed(2)}</span></div>
			{/if}
			{#if Number(order.loyaltyCoinsDiscount) > 0}
				<div class="flex justify-between text-purple-600"><span>Coins Redeemed ({order.loyaltyCoinsRedeemed})</span><span>−₹{Number(order.loyaltyCoinsDiscount).toFixed(2)}</span></div>
			{/if}
			<div class="flex justify-between text-gray-600"><span>Delivery</span><span>{Number(order.deliveryFee) === 0 ? 'FREE' : `₹${Number(order.deliveryFee).toFixed(2)}`}</span></div>
			<div class="flex justify-between font-bold text-gray-800 text-base pt-1 border-t border-gray-100">
				<span>Total</span><span class="text-purple-700">₹{Number(order.grandTotal).toFixed(2)}</span>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
		<!-- Address -->
		<div class="bg-white rounded-2xl border border-gray-100 p-5">
			<h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2"><MapPin size={18} class="text-purple-600" /> {order.fulfillmentType === 'PICKUP' ? 'Pickup' : 'Delivery Address'}</h2>
			{#if order.fulfillmentType === 'PICKUP'}
				<div class="text-sm text-gray-700">Pick up from the medical store. Show token <strong>{order.pickupToken}</strong> to staff.</div>
			{:else}
			<div class="text-sm text-gray-700 space-y-0.5">
				<div class="font-semibold">{addr.recipientName}</div>
				<div>{addr.addressLine1}{addr.addressLine2 ? ', ' + addr.addressLine2 : ''}</div>
				{#if addr.landmark}<div>{addr.landmark}</div>{/if}
				<div>{addr.city}, {addr.state} - {addr.postalCode}</div>
				<div class="text-gray-500">{addr.phone}</div>
			</div>
			{/if}
		</div>

		<!-- Payment -->
		<div class="bg-white rounded-2xl border border-gray-100 p-5">
			<h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2"><CreditCard size={18} class="text-purple-600" /> Payment</h2>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-500">Method</span>
					<span class="font-medium">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (Razorpay)'}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Status</span>
					<span class="font-medium {order.paymentStatus === 'PAID' ? 'text-green-600' : order.paymentStatus === 'FAILED' ? 'text-red-500' : 'text-yellow-600'}">{order.paymentStatus}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Prescription -->
	{#if prescription}
		<div class="bg-white rounded-2xl border border-gray-100 p-5">
			<h2 class="font-bold text-gray-800 mb-3 flex items-center gap-2"><FileText size={18} class="text-orange-500" /> Prescription</h2>
			<div class="flex items-center justify-between">
				<div>
					<div class="text-sm text-gray-700">{prescription.originalFilename}</div>
					<div class="text-xs text-gray-400 mt-0.5">Status: <span class="font-medium {prescription.status === 'APPROVED' ? 'text-green-600' : prescription.status === 'REJECTED' ? 'text-red-500' : 'text-yellow-600'}">{prescription.status.replace(/_/g, ' ')}</span></div>
					{#if prescription.pharmacistNotes}<div class="text-xs text-blue-600 mt-1">Notes: {prescription.pharmacistNotes}</div>{/if}
					{#if prescription.rejectionReason}<div class="text-xs text-red-500 mt-1">Reason: {prescription.rejectionReason}</div>{/if}
				</div>
				<a href={`/api/prescriptions/${prescription.id}`} target="_blank" rel="noreferrer" class="text-sm text-purple-600 hover:text-purple-700 font-medium">View →</a>
			</div>
		</div>
	{/if}
</div>
