<script lang="ts">
	import type { PageData } from './$types';
	import { Package, Wallet, Bell, ShoppingBag, ChevronRight, FileText } from 'lucide-svelte';

	let { data }: {  data: PageData  } = $props();

	const statusColors: Record<string, string> = {
		PENDING: 'bg-yellow-100 text-yellow-700',
		CONFIRMED: 'bg-blue-100 text-blue-700',
		PACKED: 'bg-indigo-100 text-indigo-700',
		OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
		DELIVERED: 'bg-green-100 text-green-700',
		CANCELLED: 'bg-red-100 text-red-700'
	};
</script>

<svelte:head>
	<title>Dashboard – E-Medical Sehore</title>
</svelte:head>

<div class="p-6 max-w-5xl mx-auto">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Hello, {data.user?.fullName?.split(' ')[0]} 👋</h1>
		<p class="text-gray-500 text-sm mt-1">Welcome to your pharmacy dashboard</p>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
		<div class="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-5 text-white">
			<Wallet size={24} class="mb-2 opacity-80" />
			<div class="text-3xl font-bold">{data.wallet?.balanceCoins ?? 0}</div>
			<div class="text-purple-100 text-sm">Reward Coins</div>
			<div class="text-xs text-purple-200 mt-1">≈ ₹{((data.wallet?.balanceCoins ?? 0) * 0.1).toFixed(2)} value</div>
		</div>
		<div class="bg-white rounded-2xl border border-gray-100 p-5">
			<Package size={24} class="text-blue-500 mb-2" />
			<div class="text-3xl font-bold text-gray-800">{data.recentOrders.length}</div>
			<div class="text-gray-500 text-sm">Recent Orders</div>
			<a href="/customer/orders" class="text-xs text-purple-600 mt-1 inline-block hover:text-purple-700">View all →</a>
		</div>
		<div class="bg-white rounded-2xl border border-gray-100 p-5">
			<Bell size={24} class="text-orange-500 mb-2" />
			<div class="text-3xl font-bold text-gray-800">{data.notificationCount}</div>
			<div class="text-gray-500 text-sm">Notifications</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
		{#each [
			{ href: '/shop', icon: ShoppingBag, label: 'Order Medicines', color: 'purple' },
			{ href: '/prescriptions/upload', icon: FileText, label: 'Upload Rx', color: 'orange' },
			{ href: '/customer/orders', icon: Package, label: 'Track Orders', color: 'blue' },
			{ href: '/customer/wallet', icon: Wallet, label: 'My Wallet', color: 'purple' }
		] as action}
			<a href={action.href} class="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-purple-200 transition-all text-center">
				<div class="w-10 h-10 bg-{action.color}-50 rounded-xl flex items-center justify-center">
					<action.icon size={20} class="text-{action.color}-600" />
				</div>
				<span class="text-xs font-medium text-gray-700">{action.label}</span>
			</a>
		{/each}
	</div>

	<!-- Recent Orders -->
	<div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
		<div class="p-4 flex items-center justify-between border-b border-gray-100">
			<h2 class="font-bold text-gray-800">Recent Orders</h2>
			<a href="/customer/orders" class="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
				View All <ChevronRight size={16} />
			</a>
		</div>
		{#if data.recentOrders.length === 0}
			<div class="p-8 text-center text-gray-400">
				<Package size={40} class="mx-auto mb-3 opacity-30" />
				<p class="font-medium">No orders yet</p>
				<a href="/shop" class="mt-3 inline-block text-purple-600 font-medium text-sm hover:text-purple-700">Order Now</a>
			</div>
		{:else}
			<div class="divide-y divide-gray-50">
				{#each data.recentOrders as order}
					<a href="/customer/orders/{order.id}" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
						<div>
							<div class="font-semibold text-gray-800 text-sm">{order.orderNumber}</div>
							<div class="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
						</div>
						<div class="text-right">
							<span class="inline-block text-xs font-medium px-2 py-0.5 rounded-full {statusColors[order.status] ?? 'bg-gray-100 text-gray-600'}">
								{order.status.replace(/_/g, ' ')}
							</span>
							<div class="text-sm font-bold text-purple-700 mt-1">₹{Number(order.grandTotal).toFixed(2)}</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
