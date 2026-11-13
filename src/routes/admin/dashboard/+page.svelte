<script lang="ts">
	import type { PageData } from './$types';
	import {
		TrendingUp, Package, Clock, CheckCircle, XCircle, Users, Pill,
		AlertTriangle, FileText, IndianRupee, ArrowUpRight
	} from 'lucide-svelte';

	let { data }: {  data: PageData  } = $props();
	let { stats, recentOrders } = $derived(data);

	const statusColors: Record<string, string> = {
		PENDING: 'bg-yellow-100 text-yellow-700',
		UNDER_VERIFICATION: 'bg-blue-100 text-blue-700',
		APPROVED: 'bg-teal-100 text-teal-700',
		CONFIRMED: 'bg-indigo-100 text-indigo-700',
		PACKED: 'bg-purple-100 text-purple-700',
		OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
		DELIVERED: 'bg-green-100 text-green-700',
		CANCELLED: 'bg-red-100 text-red-700',
		REFUNDED: 'bg-gray-100 text-gray-600',
		PRESCRIPTION_REQUIRED: 'bg-orange-100 text-orange-700'
	};

	const statCards = $derived([
		{ label: 'Total Revenue', value: `₹${Number(stats.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, icon: IndianRupee, color: 'purple', note: `₹${Number(stats.monthlyRevenue).toLocaleString('en-IN')} this month` },
		{ label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'blue', note: `${stats.pendingOrders} pending` },
		{ label: 'Completed', value: stats.completedOrders, icon: CheckCircle, color: 'green', note: `${stats.cancelledOrders} cancelled` },
		{ label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'violet', note: 'registered' },
		{ label: 'Total Medicines', value: stats.totalMedicines, icon: Pill, color: 'teal', note: `${stats.lowStockMedicines} low stock` },
		{ label: 'Prescriptions', value: stats.pendingPrescriptions, icon: FileText, color: 'orange', note: 'pending review', link: '/admin/prescriptions' }
	]);
</script>

<svelte:head>
	<title>Admin Dashboard – E-Medical Sehore</title>
</svelte:head>


<div class="p-4 sm:p-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Dashboard</h1>
		<p class="text-gray-500 text-sm mt-1">Pharmacy analytics overview</p>
	</div>

	<!-- Stat Cards -->
	<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
		{#each statCards as card}
			<div class="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow {card.link ? 'cursor-pointer' : ''}">
				{#if card.link}
					<a href={card.link} class="block">
						<div class="flex items-center justify-between mb-3">
							<div class="w-8 h-8 bg-{card.color}-100 rounded-lg flex items-center justify-center">
								<card.icon size={16} class="text-{card.color}-600" />
							</div>
							<ArrowUpRight size={14} class="text-gray-300" />
						</div>
						<div class="text-xl font-bold text-gray-800">{card.value}</div>
						<div class="text-xs text-gray-500 mt-0.5">{card.label}</div>
						{#if card.note}<div class="text-xs text-{card.color}-600 mt-0.5">{card.note}</div>{/if}
					</a>
				{:else}
					<div class="flex items-center justify-between mb-3">
						<div class="w-8 h-8 bg-{card.color}-100 rounded-lg flex items-center justify-center">
							<card.icon size={16} class="text-{card.color}-600" />
						</div>
					</div>
					<div class="text-xl font-bold text-gray-800">{card.value}</div>
					<div class="text-xs text-gray-500 mt-0.5">{card.label}</div>
					{#if card.note}<div class="text-xs text-{card.color}-600 mt-0.5">{card.note}</div>{/if}
				{/if}
			</div>
		{/each}
	</div>

	<!-- Alerts -->
	{#if stats.lowStockMedicines > 0}
		<div class="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-amber-700 text-sm">
			<AlertTriangle size={18} />
			<span>{stats.lowStockMedicines} medicines are running low on stock. <a href="/admin/medicines?filter=low_stock" class="underline font-medium">View →</a></span>
		</div>
	{/if}

	{#if stats.pendingPrescriptions > 0}
		<div class="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-6 text-orange-700 text-sm">
			<FileText size={18} />
			<span>{stats.pendingPrescriptions} prescription(s) waiting for verification. <a href="/admin/prescriptions" class="underline font-medium">Review now →</a></span>
		</div>
	{/if}

	<!-- Recent Orders -->
	<div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
		<div class="flex items-center justify-between p-5 border-b border-gray-100">
			<h2 class="font-bold text-gray-800">Recent Orders</h2>
			<a href="/admin/orders" class="text-sm text-purple-600 hover:text-purple-700 font-medium">View All →</a>
		</div>
		{#if recentOrders.length === 0}
			<div class="p-8 text-center text-gray-400">No orders yet.</div>
		{:else}
			<div class="divide-y divide-gray-100 md:hidden">
				{#each recentOrders as order}
					<a href="/admin/orders/{order.id}" class="block p-4 active:bg-purple-50">
						<div class="flex justify-between gap-3">
							<div class="min-w-0"><div class="font-semibold text-purple-700 truncate">{order.orderNumber}</div><div class="mt-1 text-sm text-gray-700 truncate">{order.customerName}</div><div class="mt-1 text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN')}</div></div>
							<div class="shrink-0 text-right"><div class="font-bold text-gray-800">₹{Number(order.grandTotal).toLocaleString('en-IN')}</div><span class="mt-2 inline-block rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-700">{order.status.replace(/_/g, ' ')}</span></div>
						</div>
					</a>
				{/each}
			</div>
			<div class="hidden md:block overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 border-b border-gray-100">
						<tr>
							<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
							<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
							<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
							<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
							<th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
							<th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-50">
						{#each recentOrders as order}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-5 py-3">
									<a href="/admin/orders/{order.id}" class="text-purple-600 hover:text-purple-700 font-medium">{order.orderNumber}</a>
								</td>
								<td class="px-5 py-3 text-gray-700">{order.customerName}</td>
								<td class="px-5 py-3">
									<span class="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full {statusColors[order.status] ?? 'bg-gray-100 text-gray-600'}">
										{order.status.replace(/_/g, ' ')}
									</span>
								</td>
								<td class="px-5 py-3 text-gray-500">{order.paymentMethod}</td>
								<td class="px-5 py-3 text-right font-semibold text-purple-700">₹{Number(order.grandTotal).toLocaleString('en-IN')}</td>
								<td class="px-5 py-3 text-right text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
