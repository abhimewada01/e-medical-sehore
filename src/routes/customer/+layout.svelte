<script lang="ts">
	import { Package, FileText, Wallet, User, ChevronRight, LogOut } from 'lucide-svelte';
	import type { LayoutData } from './$types';

	let { data, children }: {  data: LayoutData; children: import("svelte").Snippet  } = $props();

	const navItems = [
		{ href: '/customer/dashboard', icon: User, label: 'Dashboard' },
		{ href: '/customer/orders', icon: Package, label: 'My Orders' },
		{ href: '/customer/prescriptions', icon: FileText, label: 'Prescriptions' },
		{ href: '/customer/wallet', icon: Wallet, label: 'Reward Wallet' }
	];
</script>

<div class="min-h-screen bg-gray-50 flex">
	<!-- Sidebar (desktop) -->
	<aside class="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 py-6 px-3 fixed h-full z-20">
		<a href="/" class="flex items-center gap-2 px-3 mb-8">
			<div class="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">EM</div>
			<span class="font-bold text-purple-700 text-sm">E-Medical</span>
		</a>
		<nav class="flex-1 space-y-1">
			{#each navItems as item}
				<a href={item.href} class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-purple-50 hover:text-purple-700 transition-colors">
					<item.icon size={18} />
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="mt-auto pt-4 border-t border-gray-100">
			<div class="px-3 py-2 text-xs text-gray-400 truncate">{data.user?.email}</div>
			<a href="/auth/logout" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
				<LogOut size={18} />
				Logout
			</a>
		</div>
	</aside>

	<!-- Main content -->
	<div class="flex-1 md:ml-56">
		<!-- Mobile top bar -->
		<div class="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
			<a href="/" class="font-bold text-purple-700">E-Medical Sehore</a>
			<div class="flex items-center gap-3">
				{#each navItems as item}
					<a href={item.href} class="text-gray-500 hover:text-purple-600">
						<item.icon size={20} />
					</a>
				{/each}
				<a href="/auth/logout" class="text-red-400 hover:text-red-600">
					<LogOut size={20} />
				</a>
			</div>
		</div>
		{@render children()}
	</div>
</div>
