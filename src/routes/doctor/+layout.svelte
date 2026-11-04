<script lang="ts">
	import type { LayoutData } from './$types';
	import { Stethoscope, QrCode, User, LogOut, BarChart } from 'lucide-svelte';

	let { data, children }: {  data: LayoutData; children: import("svelte").Snippet  } = $props();

	const navItems = [
		{ href: '/doctor/dashboard', icon: BarChart, label: 'Dashboard' },
		{ href: '/doctor/profile', icon: User, label: 'Profile' }
	];
</script>

<div class="min-h-screen bg-gray-50 flex">
	<aside class="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 py-6 px-3 fixed h-full z-20">
		<div class="px-3 mb-8 flex items-center gap-2">
			<Stethoscope size={20} class="text-blue-600" />
			<div>
				<div class="font-bold text-blue-700 text-sm">E-Medical</div>
				<div class="text-xs text-gray-400">Doctor Portal</div>
			</div>
		</div>
		<nav class="flex-1 space-y-1">
			{#each navItems as item}
				<a href={item.href} class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
					<item.icon size={18} /> {item.label}
				</a>
			{/each}
		</nav>
		<div class="mt-auto pt-4 border-t border-gray-100">
			<div class="px-3 py-2 text-xs text-gray-400 truncate">{data.user?.fullName}</div>
			<a href="/auth/logout" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
				<LogOut size={18} /> Logout
			</a>
		</div>
	</aside>
	<div class="flex-1 md:ml-56">
		<div class="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
			<span class="font-bold text-blue-700">Doctor Portal</span>
			<div class="flex gap-3">
				{#each navItems as item}
					<a href={item.href} class="text-gray-500 hover:text-blue-600"><item.icon size={20} /></a>
				{/each}
				<a href="/auth/logout" class="text-red-400 hover:text-red-600"><LogOut size={20} /></a>
			</div>
		</div>
		{@render children()}
	</div>
</div>
