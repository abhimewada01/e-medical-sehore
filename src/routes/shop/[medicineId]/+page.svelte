<script lang="ts">
	import type { PageData } from './$types';
	import { ShoppingCart, AlertCircle, Package, Shield } from 'lucide-svelte';

	let { data }: {  data: PageData  } = $props();
	let { medicine: med, category } = $derived(data);

	let qty = $state(1);
	let added = $state(false);

	function addToCart() {
		if (typeof window === 'undefined') return;
		const cart: Record<string, { qty: number; name: string; price: number; rx: boolean; imageUrl?: string | null }> = JSON.parse(
			localStorage.getItem('emedCart') || '{}'
		);
		if (cart[med.id]) {
			cart[med.id].qty += qty;
		} else {
			cart[med.id] = { qty, name: med.name, price: Number(med.discountedPrice), rx: med.requiresPrescription, imageUrl: med.imageUrl };
		}
		localStorage.setItem('emedCart', JSON.stringify(cart));
		window.dispatchEvent(new CustomEvent('cart-updated'));
		added = true;
		setTimeout(() => (added = false), 2000);
	}

	const discount = $derived(
		med.price && med.discountedPrice
			? Math.round(((Number(med.price) - Number(med.discountedPrice)) / Number(med.price)) * 100)
			: 0
	);
</script>

<svelte:head>
	<title>{med.name} – E-Medical Sehore</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
	<div class="text-sm text-gray-400 mb-4">
		<a href="/" class="hover:text-purple-600">Home</a> /
		<a href="/shop" class="hover:text-purple-600">Medicines</a>
		{#if category}/ <a href="/shop?category={category.slug}" class="hover:text-purple-600">{category.name}</a>{/if}
		/ <span class="text-gray-700">{med.name}</span>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-10">
		<!-- Image -->
		<div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl flex items-center justify-center aspect-square">
			{#if med.imageUrl}
				<img src={med.imageUrl} alt={med.name} class="w-3/4 h-3/4 object-contain" />
			{:else}
				<div class="w-3/4 h-3/4 rounded-3xl border border-dashed border-purple-200 bg-white/70" aria-label="No product photo added"></div>
			{/if}
		</div>

		<!-- Details -->
		<div>
			{#if category}
				<div class="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-2">{category.name}</div>
			{/if}
			<h1 class="text-2xl font-bold text-gray-900 mb-1">{med.name}</h1>
			{#if med.brandName}
				<div class="text-gray-500 text-sm mb-1">Brand: {med.brandName}</div>
			{/if}
			{#if med.strength}
				<div class="text-gray-500 text-sm mb-1">Strength: {med.strength}</div>
			{/if}
			{#if med.packSize}
				<div class="text-gray-500 text-sm mb-3">Pack: {med.packSize}</div>
			{/if}
			{#if med.manufacturer}
				<div class="text-gray-500 text-xs mb-4">Mfr: {med.manufacturer}</div>
			{/if}

			<!-- Price -->
			<div class="flex items-baseline gap-3 mb-4">
				<span class="text-3xl font-bold text-purple-700">₹{Number(med.discountedPrice).toFixed(2)}</span>
				{#if discount > 0}
					<span class="text-lg text-gray-400 line-through">₹{Number(med.price).toFixed(2)}</span>
					<span class="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{discount}% OFF</span>
				{/if}
			</div>

			{#if med.requiresPrescription}
				<div class="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-4 text-orange-700 text-sm">
					<AlertCircle size={18} />
					<span>This medicine requires a valid doctor's prescription</span>
				</div>
			{/if}

			{#if med.isAgeRestricted}
				<div class="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-600 text-sm">
					<Shield size={18} />
					<span>Age-restricted product (18+ only)</span>
				</div>
			{/if}

			{#if med.stockQuantity === 0}
				<div class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-600 text-sm font-medium">
					Out of Stock
				</div>
			{:else}
				<div class="text-xs text-green-600 font-medium mb-4">✓ In Stock ({med.stockQuantity} units available)</div>
				<!-- Quantity + Add to Cart -->
				<div class="flex items-center gap-4 mb-4">
					<div class="flex items-center border border-gray-200 rounded-xl overflow-hidden">
						<button onclick={() => qty = Math.max(1, qty - 1)} class="px-3 py-2 hover:bg-gray-50 text-gray-600 font-bold">−</button>
						<span class="px-4 py-2 font-semibold text-gray-800">{qty}</span>
						<button onclick={() => qty = Math.min(med.stockQuantity, qty + 1)} class="px-3 py-2 hover:bg-gray-50 text-gray-600 font-bold">+</button>
					</div>
					<button
						onclick={addToCart}
						class="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
					>
						<ShoppingCart size={20} />
						{added ? 'Added ✓' : 'Add to Cart'}
					</button>
				</div>
				<a href="/cart" class="block w-full text-center border-2 border-purple-600 text-purple-700 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
					Buy Now
				</a>
			{/if}
		</div>
	</div>

	<!-- Description & Info Tabs -->
	<div class="mt-10 bg-white rounded-2xl border border-gray-100 overflow-hidden">
		<div class="p-6 space-y-6">
			{#if med.description}
				<div>
					<h2 class="font-bold text-gray-800 mb-2">About this medicine</h2>
					<p class="text-gray-600 text-sm leading-relaxed">{med.description}</p>
				</div>
			{/if}
			{#if med.composition}
				<div>
					<h2 class="font-bold text-gray-800 mb-2">Composition / Salt</h2>
					<p class="text-gray-600 text-sm">{med.composition}</p>
				</div>
			{/if}
			{#if med.usageInstructions}
				<div>
					<h2 class="font-bold text-gray-800 mb-2">Usage Instructions</h2>
					<p class="text-gray-600 text-sm leading-relaxed">{med.usageInstructions}</p>
				</div>
			{/if}
			{#if med.sideEffects}
				<div>
					<h2 class="font-bold text-gray-800 mb-2">Side Effects</h2>
					<p class="text-gray-600 text-sm leading-relaxed">{med.sideEffects}</p>
				</div>
			{/if}
			{#if med.storageInstructions}
				<div>
					<h2 class="font-bold text-gray-800 mb-2">Storage</h2>
					<p class="text-gray-600 text-sm">{med.storageInstructions}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
