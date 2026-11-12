<script lang="ts">
	import type { LayoutData } from './$types';
	import {
		LayoutDashboard, Package, Pill, FileText, Users, Stethoscope, Coins,
		Settings, LogOut, Menu, X, Bell, CreditCard, Images, BarChart3
	} from 'lucide-svelte';

	let { data, children }: {  data: LayoutData; children: import("svelte").Snippet  } = $props();
	let sidebarOpen = $state(false);

	const navItems = [
		{ href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
		{ href: '/admin/orders', icon: Package, label: 'Orders' },
		{ href: '/admin/medicines', icon: Pill, label: 'Medicines' },
		{ href: '/admin/prescriptions', icon: FileText, label: 'Prescriptions' },
		{ href: '/admin/users', icon: Users, label: 'Users' },
		{ href: '/admin/payments', icon: CreditCard, label: 'Payments' },
		{ href: '/admin/content', icon: Images, label: 'Content library' },
		{ href: '/admin/reports', icon: BarChart3, label: 'Reports' },
		{ href: '/admin/doctors', icon: Stethoscope, label: 'Doctors' },
		{ href: '/admin/rewards', icon: Coins, label: 'Rewards' },
		{ href: '/admin/settings', icon: Settings, label: 'Settings' }
	];
</script>

<div class="min-h-screen bg-gray-50 flex">
	<!-- Desktop Sidebar -->
	<aside class="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 py-5 px-3 fixed h-full z-20">
		<div class="px-3 mb-8">
			<div class="font-bold text-purple-700 text-lg leading-none">E-Medical</div>
			<div class="text-xs text-gray-400">Admin Dashboard</div>
		</div>
		<nav class="flex-1 space-y-0.5 overflow-y-auto">
			{#each navItems as item}
				<a href={item.href} class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors">
					<item.icon size={18} />
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="mt-auto pt-4 border-t border-gray-100">
			<div class="px-3 py-2 text-xs text-gray-400 truncate">{data.user?.fullName}</div>
			<div class="px-3 py-1 text-xs font-medium text-purple-600 capitalize">{data.user?.role?.replace('_', ' ')}</div>
			<a href="/auth/logout" class="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
				<LogOut size={18} /> Logout
			</a>
		</div>
	</aside>

	<!-- Mobile header -->
	<div class="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
		<span class="font-bold text-purple-700">Admin</span>
		<button onclick={() => sidebarOpen = !sidebarOpen} class="p-1 text-gray-600">
			{#if sidebarOpen}<X size={22} />{:else}<Menu size={22} />{/if}
		</button>
	</div>

	<!-- Mobile sidebar -->
	{#if sidebarOpen}
		<div class="md:hidden fixed inset-0 z-20 bg-black/40" onclick={() => sidebarOpen = false}></div>
		<aside class="md:hidden fixed left-0 top-0 h-full w-64 bg-white z-30 py-5 px-3 flex flex-col">
			<div class="px-3 mb-6">
				<div class="font-bold text-purple-700 text-lg">E-Medical Admin</div>
			</div>
			<nav class="flex-1 space-y-0.5">
				{#each navItems as item}
					<a href={item.href} onclick={() => sidebarOpen = false} class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors">
						<item.icon size={18} /> {item.label}
					</a>
				{/each}
			</nav>
			<a href="/auth/logout" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
				<LogOut size={18} /> Logout
			</a>
		</aside>
	{/if}

	<!-- Main content -->
	<div class="flex-1 md:ml-60 pt-0 md:pt-0">
		<div class="hidden md:flex items-center justify-between bg-white border-b border-gray-100 px-6 py-3 sticky top-0 z-10">
			<div class="text-sm text-gray-500">Welcome back, <span class="font-semibold text-gray-800">{data.user?.fullName}</span></div>
			<a href="/admin/notifications" aria-label="Notifications" class="relative p-2 text-gray-400 hover:text-purple-600">
				<Bell size={20} />
				{#if data.unreadNotifications > 0}<span class="absolute -right-1 -top-1 min-w-5 h-5 rounded-full bg-red-500 px-1 text-center text-xs leading-5 text-white">{data.unreadNotifications > 99 ? '99+' : data.unreadNotifications}</span>{/if}
			</a>
		</div>
		<div class="pt-14 md:pt-0">
			{@render children()}
		</div>
	</div>
</div>
