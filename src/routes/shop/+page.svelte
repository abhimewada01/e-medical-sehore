<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { ShoppingCart, Search } from 'lucide-svelte';

	let { data }: {  data: PageData  } = $props();

	let searchQ = $state(data.q);
	let cartItems: Record<string, number> = $state({});

	function addToCart(medicineId: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		let cart: Record<string, { qty: number; name: string; price: number; rx: boolean; imageUrl?: string | null }>;
		try { cart = JSON.parse(localStorage.getItem('emedCart') || '{}'); } catch { cart = {}; }
		const med = data.medicines.find((item) => item.id === medicineId);
		if (!med) return;
		if (cart[medicineId]) cart[medicineId].qty += 1;
		else cart[medicineId] = { qty: 1, name: med.name, price: Number(med.discountedPrice), rx: med.requiresPrescription, imageUrl: med.imageUrl };
		localStorage.setItem('emedCart', JSON.stringify(cart));
		cartItems = Object.fromEntries(Object.entries(cart).map(([id, item]) => [id, item.qty]));
		// Dispatch custom event to update navbar cart count
		window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
	}

	function handleSearch(e: SubmitEvent) {
		e.preventDefault();
		const query = searchQ.trim();
		goto(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop');
	}

</script>

<svelte:head>
	<title>Medicines – E-Medical Sehore</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<!-- Simple medicine search -->
	<div class="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
		<form onsubmit={handleSearch} class="flex gap-3">
			<div class="flex-1 relative">
				<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
				<input
					type="search"
					bind:value={searchQ}
					placeholder="Search medicines, generics, brands..."
					class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-sm"
				/>
			</div>
			<button type="submit" class="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700">
				Search
			</button>
		</form>
	</div>

	<!-- Results header -->
	<div class="flex items-center justify-between mb-4">
		<h1 class="text-lg font-semibold text-gray-800">
			{data.q ? `Results for "${data.q}"` : data.category ? `Category: ${data.category}` : 'All Medicines'}
			<span class="text-gray-400 font-normal text-sm ml-2">({data.medicines.length} items)</span>
		</h1>
	</div>

	<div class="shop-results-layout" class:with-compositions={data.compositions.length > 0}>
	<div class="shop-results-main">
	<!-- Medicine Grid -->
	{#if data.medicines.length === 0}
		<div class="text-center py-16 text-gray-400">
			<div class="text-5xl mb-4">🔍</div>
			<p class="text-lg font-medium">No medicines found</p>
			<p class="text-sm mt-1">Try a different search term or category</p>
			<a href="/shop" class="mt-4 inline-block text-purple-600 font-medium hover:text-purple-700">View all medicines</a>
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
			{#each data.medicines as med}
				<div class="medicine-list-card bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all overflow-hidden group">
					<a href={med.isDemo ? '/shop?q=Paracetamol' : `/shop/${med.id}`} class="block text-inherit no-underline">
					<div class="aspect-square bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-3">
						{#if med.imageUrl}
							<img src={med.imageUrl} alt={med.name} class="w-full h-full object-contain rounded-lg" />
						{:else}
							<div class="w-full h-full rounded-lg border border-dashed border-purple-200 bg-white/70" aria-label="No product photo added"></div>
						{/if}
					</div>
					<div class="p-3">
						<div class="text-xs text-purple-600 font-medium mb-1">{med.dosageForm}</div>
						<h3 class="font-semibold text-gray-800 text-sm line-clamp-2 leading-tight mb-1">{med.name}</h3>
						{#if med.strength}
							<div class="text-xs text-gray-400 mb-1">{med.strength}</div>
						{/if}
						{#if med.packSize}<div class="text-xs text-gray-400 mb-2">{med.packSize}</div>{/if}
					</div>
					</a>
					<div class="px-3 pb-3">
						{#if med.isDemo}<span class="text-xs text-amber-700 font-medium">Demo listing · price pending</span>{:else}<div class="flex items-center gap-1 mb-2">
							<span class="text-purple-700 font-bold text-sm">₹{Number(med.discountedPrice).toFixed(2)}</span>
							{#if Number(med.price) > Number(med.discountedPrice)}
								<span class="text-xs text-gray-400 line-through">₹{Number(med.price).toFixed(2)}</span>
							{/if}
						</div>{/if}
						<div class="flex items-center justify-between">
							{#if med.isDemo}
								<span class="text-xs text-gray-500">Not available to order</span>
							{:else if med.requiresPrescription}
								<span class="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Rx Required</span>
							{:else if med.stockQuantity === 0}
								<span class="text-xs text-red-500 font-medium">Out of Stock</span>
							{:else}
								<button type="button"
									onclick={(e) => addToCart(med.id, e)}
									class="w-full text-xs bg-purple-600 text-white py-1.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
								>
									<ShoppingCart size={12} />
									{cartItems[med.id] ? `Add more · ${cartItems[med.id]}` : 'Add to Cart'}
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if data.medicines.length === 20}
			<div class="mt-8 flex justify-center gap-3">
				{#if data.page > 1}
					<a href="/shop?{new URLSearchParams({...Object.fromEntries(new URL('http://x/shop?' + (typeof window !== 'undefined' ? window.location.search.slice(1) : '')).searchParams), page: String(data.page - 1)}).toString()}"
						class="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:border-purple-400">
						← Prev
					</a>
				{/if}
				<a href="/shop?{new URLSearchParams({...Object.fromEntries(new URL('http://x/shop').searchParams), page: String(data.page + 1)}).toString()}"
					class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
					Next →
				</a>
			</div>
		{/if}
	{/if}
	</div>
	{#if data.compositions.length > 0}
		<aside class="composition-panel" aria-label="Matching compositions">
			<h2>Matching compositions</h2>
			<div class="composition-list">
				{#each data.compositions as composition (composition)}
					<a href="/shop?q={encodeURIComponent(composition)}">{composition}</a>
				{/each}
			</div>
		</aside>
	{/if}
	</div>
</div>

<style>
	.shop-results-layout{display:block}.shop-results-layout.with-compositions{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:18px;align-items:start}.shop-results-main{min-width:0}.composition-panel{position:sticky;top:18px;overflow:hidden;border:1px solid #e3e8e5;border-radius:14px;background:white}.composition-panel h2{margin:0;padding:15px 17px;background:#344047;color:#fff;font-size:15px;font-weight:650}.composition-list a{display:block;padding:13px 15px;border-bottom:1px solid #e5e9e7;color:#3d4944;font-size:13px;text-decoration:none}.composition-list a:nth-child(odd){background:#f6f7f7}.composition-list a:hover{color:#137b61;background:#eaf5ef}.composition-list a:last-child{border-bottom:0}
	.shop-results-layout.with-compositions .shop-results-main>div.grid{grid-template-columns:repeat(3,minmax(0,1fr))}
	@media(max-width:900px){.shop-results-layout.with-compositions{grid-template-columns:minmax(0,1fr) 230px;gap:12px}}
	@media(max-width:900px){.shop-results-layout.with-compositions .shop-results-main>div.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
	@media(max-width:680px){.shop-results-layout.with-compositions{display:flex;flex-direction:column}.shop-results-layout.with-compositions .shop-results-main{width:100%}.shop-results-layout.with-compositions .shop-results-main>div.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.composition-panel{position:static;width:100%;order:-1}.composition-panel h2{padding:12px 14px}.composition-list a{padding:11px 13px}}
</style>
