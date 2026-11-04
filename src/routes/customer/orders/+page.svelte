<script lang="ts">
	import type { PageData } from './$types';
	import { Package, ChevronRight } from 'lucide-svelte';

	let { data }: {  data: PageData  } = $props();

	const statusColors: Record<string, string> = {
		PENDING: 'bg-yellow-100 text-yellow-700',
		CONFIRMED: 'bg-blue-100 text-blue-700',
		PACKED: 'bg-indigo-100 text-indigo-700',
		OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
		DELIVERED: 'bg-green-100 text-green-700',
		PICKED_UP: 'bg-green-100 text-green-700',
		CANCELLED: 'bg-red-100 text-red-700',
		PRESCRIPTION_REQUIRED: 'bg-orange-100 text-orange-700',
		UNDER_VERIFICATION: 'bg-blue-100 text-blue-700'
	};
</script>

<svelte:head>
	<title>My Orders – E-Medical Sehore</title>
</svelte:head>

<div class="p-6 max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

	{#if data.orders.length === 0}
		<div class="text-center py-16 bg-white rounded-2xl border border-gray-100">
			<Package size={48} class="mx-auto mb-4 text-gray-200" />
			<h2 class="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
			<p class="text-gray-400 mb-6">Browse our medicines and place your first order</p>
			<a href="/shop" class="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors">
				Browse Medicines
			</a>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.orders as order}
				<a href="/customer/orders/{order.id}" class="block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-purple-200 transition-all">
					<div class="flex items-center justify-between">
						<div>
							<div class="font-semibold text-gray-800">{order.orderNumber}</div>
							{#if order.fulfillmentType === 'PICKUP'}
								<div class="text-xs text-purple-700 mt-1">Pickup token: <strong>{order.pickupToken}</strong></div>
							{/if}
							<div class="text-sm text-gray-400 mt-0.5">
								{new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
							</div>
							<div class="text-sm text-gray-500 mt-1">
								{order.paymentMethod} · {order.paymentStatus}
							</div>
						</div>
						<div class="text-right flex flex-col items-end gap-2">
							<span class="text-xs font-medium px-2 py-1 rounded-full {statusColors[order.status] ?? 'bg-gray-100 text-gray-600'}">
								{order.status.replace(/_/g, ' ')}
							</span>
							<div class="font-bold text-purple-700">₹{Number(order.grandTotal).toFixed(2)}</div>
							<ChevronRight size={16} class="text-gray-400" />
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
