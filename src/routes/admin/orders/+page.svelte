<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data }: {  data: PageData  } = $props();

	const statusColors: Record<string, string> = {
		PENDING: 'bg-yellow-100 text-yellow-700',
		PRESCRIPTION_REQUIRED: 'bg-orange-100 text-orange-700',
		UNDER_VERIFICATION: 'bg-blue-100 text-blue-700',
		APPROVED: 'bg-teal-100 text-teal-700',
		CONFIRMED: 'bg-indigo-100 text-indigo-700',
		PACKED: 'bg-purple-100 text-purple-700',
		OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
		DELIVERED: 'bg-green-100 text-green-700',
		CANCELLED: 'bg-red-100 text-red-700',
		REFUNDED: 'bg-gray-100 text-gray-600'
	};

	function filterByStatus(status: string) {
		const params = new URLSearchParams();
		if (status) params.set('status', status);
		goto(`/admin/orders?${params}`);
	}

	function goToPage(pageNumber: number) {
		const params = new URLSearchParams();
		if (data.selectedStatus) params.set('status', data.selectedStatus);
		params.set('page', String(pageNumber));
		goto(`/admin/orders?${params}`);
	}
</script>

<svelte:head>
	<title>Orders – Admin</title>
</svelte:head>


<div class="p-4 sm:p-6">
	<div class="flex flex-wrap items-center justify-between gap-2 mb-5 sm:mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Orders</h1>
		<span class="text-sm text-gray-500">{data.totalOrders} {data.selectedStatus ? data.selectedStatus.toLowerCase().replace(/_/g, ' ') : 'total'} orders</span>
	</div>

	<!-- Status filter tabs -->
	<div class="flex gap-2 mb-5 overflow-x-auto pb-2 -mx-1 px-1">
			<button onclick={() => filterByStatus('')} class="shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors {!data.selectedStatus ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'}">
			All
		</button>
		{#each data.statuses as status}
			<button onclick={() => filterByStatus(status)} class="shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors {data.selectedStatus === status ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'}">
				{status.replace(/_/g, ' ')}
			</button>
		{/each}
	</div>

	<div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
		<div class="md:hidden divide-y divide-gray-100">
			{#each data.orders as order}
				<a href="/admin/orders/{order.id}" class="block p-4 active:bg-purple-50">
					<div class="flex justify-between items-start gap-3">
						<div class="min-w-0">
							<div class="font-semibold text-purple-700 truncate">{order.orderNumber}</div>
							<div class="text-sm text-gray-700 mt-1 truncate">{order.customerName}</div>
							<div class="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString('en-IN')} · {order.fulfillmentType === 'PICKUP' ? `Pickup · ${order.pickupToken}` : 'Delivery'}</div>
						</div>
						<div class="text-right shrink-0">
							<div class="font-bold text-gray-800">₹{Number(order.grandTotal).toLocaleString('en-IN')}</div>
							<span class="mt-2 inline-block text-[11px] font-medium px-2 py-1 rounded-full {statusColors[order.status] ?? 'bg-gray-100 text-gray-600'}">{order.status.replace(/_/g, ' ')}</span>
						</div>
					</div>
					<div class="mt-3 flex items-center justify-between text-xs">
						<span class="text-gray-500">{order.paymentMethod} · <span class="{order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600'}">{order.paymentStatus}</span></span>
						<span class="text-purple-600 font-medium">Open order →</span>
					</div>
				</a>
			{/each}
			{#if data.orders.length === 0}<div class="px-5 py-10 text-center text-gray-400">No orders found.</div>{/if}
		</div>
		<div class="hidden md:block overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 border-b border-gray-100">
					<tr>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Order #</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Payment</th>
						<th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Update Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-50">
					{#each data.orders as order}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3">
								<a href="/admin/orders/{order.id}" class="text-purple-600 hover:text-purple-700 font-medium">{order.orderNumber}</a>
								{#if order.prescriptionId}<div class="text-xs text-orange-500">Rx attached</div>{/if}
								<div class="text-xs text-gray-400">{order.fulfillmentType === 'PICKUP' ? `Pickup · ${order.pickupToken}` : 'Home delivery'}</div>
							</td>
							<td class="px-5 py-3 text-gray-700">{order.customerName}</td>
							<td class="px-5 py-3">
								<span class="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full {statusColors[order.status] ?? 'bg-gray-100 text-gray-600'}">
									{order.status.replace(/_/g, ' ')}
								</span>
							</td>
							<td class="px-5 py-3">
								<div class="text-xs text-gray-600">{order.paymentMethod}</div>
								<div class="text-xs font-medium {order.paymentStatus === 'PAID' ? 'text-green-600' : order.paymentStatus === 'FAILED' ? 'text-red-500' : 'text-yellow-600'}">{order.paymentStatus}</div>
							</td>
							<td class="px-5 py-3 text-right font-semibold text-purple-700">₹{Number(order.grandTotal).toLocaleString('en-IN')}</td>
							<td class="px-5 py-3 text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN')}</td>
							<td class="px-5 py-3">
								<form method="post" action="?/updateStatus" use:enhance class="flex gap-2">
									<input type="hidden" name="orderId" value={order.id} />
									<select name="status" class="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-500">
										{#each data.statuses as s}
											<option value={s} selected={s === order.status}>{s.replace(/_/g, ' ')}</option>
										{/each}
									</select>
									<button type="submit" class="text-xs bg-purple-600 text-white px-2.5 py-1 rounded-lg hover:bg-purple-700 transition-colors">Update</button>
								</form>
							</td>
						</tr>
					{/each}
					{#if data.orders.length === 0}
						<tr><td colspan="7" class="px-5 py-10 text-center text-gray-400">No orders found.</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
	<div class="mt-4 flex items-center justify-between gap-3 text-sm">
		<span class="text-gray-500">Page {data.page} of {data.totalPages}</span>
		<div class="flex gap-2">
			<button type="button" onclick={() => goToPage(data.page - 1)} disabled={data.page <= 1} class="rounded-lg border border-gray-200 bg-white px-4 py-2 font-medium text-gray-700 disabled:opacity-40">Previous</button>
			<button type="button" onclick={() => goToPage(data.page + 1)} disabled={data.page >= data.totalPages} class="rounded-lg border border-gray-200 bg-white px-4 py-2 font-medium text-gray-700 disabled:opacity-40">Next</button>
		</div>
	</div>
</div>
