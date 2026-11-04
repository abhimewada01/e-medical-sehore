<script lang="ts">
	import { ShoppingCart, User, Menu, X, Pill, Bell } from 'lucide-svelte';
	import { page } from '$app/stores';

	let { user }: { user: App.Locals['user'] } = $props();

	let mobileMenuOpen = $state(false);

	const navLinks = [
		{ href: '/shop', label: 'Medicines' },
		{ href: '/shop?category=vitamins', label: 'Vitamins' },
		{ href: '/shop?category=skincare', label: 'Skincare' },
		{ href: '/customer/prescriptions', label: 'Upload Rx' }
	];
</script>

<nav class="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
	<div class="max-w-7xl mx-auto px-4">
		<div class="flex items-center justify-between h-16">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 group">
				<div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-700 transition-colors">
					<Pill size={18} class="text-white" />
				</div>
				<div>
					<span class="font-bold text-purple-700 text-sm leading-none">E-Medical</span>
					<span class="block text-xs text-gray-500 leading-none">Sehore</span>
				</div>
			</a>

			<!-- Desktop Nav -->
			<div class="hidden md:flex items-center gap-6">
				{#each navLinks as link}
					<a href={link.href} class="text-sm text-gray-600 hover:text-purple-600 font-medium transition-colors">
						{link.label}
					</a>
				{/each}
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-3">
				<a href="/cart" class="relative p-2 text-gray-600 hover:text-purple-600 transition-colors">
					<ShoppingCart size={22} />
					<span class="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center font-bold cart-count">0</span>
				</a>

				{#if user}
					<a href="/{user.role.toLowerCase()}/dashboard" class="relative p-2 text-gray-600 hover:text-purple-600 transition-colors">
						<Bell size={22} />
					</a>
					<a href="/{user.role.toLowerCase()}/dashboard" class="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-full text-sm font-medium transition-colors">
						<User size={16} />
						<span class="hidden sm:block">{user.fullName.split(' ')[0]}</span>
					</a>
				{:else}
					<a href="/auth/login" class="text-sm text-gray-600 hover:text-purple-600 font-medium transition-colors">
						Login
					</a>
					<a href="/auth/register" class="bg-purple-600 text-white text-sm px-4 py-2 rounded-full hover:bg-purple-700 transition-colors font-medium">
						Sign Up
					</a>
				{/if}

				<!-- Mobile menu button -->
				<button class="md:hidden p-2 text-gray-600" onclick={() => mobileMenuOpen = !mobileMenuOpen}>
					{#if mobileMenuOpen}
						<X size={22} />
					{:else}
						<Menu size={22} />
					{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Menu -->
		{#if mobileMenuOpen}
			<div class="md:hidden pb-4 border-t border-gray-100 pt-4">
				{#each navLinks as link}
					<a href={link.href} class="block py-2 text-gray-600 hover:text-purple-600 font-medium" onclick={() => mobileMenuOpen = false}>
						{link.label}
					</a>
				{/each}
			</div>
		{/if}
	</div>
</nav>
