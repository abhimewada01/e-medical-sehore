<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Plus, Search, AlertTriangle, Edit, Eye, EyeOff, Package } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data }: {  data: PageData  } = $props();
	let searchQ = $state(data.q);

	function search(e: SubmitEvent) {
		e.preventDefault();
		const params = new URLSearchParams($page.url.searchParams);
		if (searchQ) params.set('q', searchQ); else params.delete('q');
		goto(`/admin/medicines?${params}`);
	}

	function formatPrice(val: unknown) {
		return `₹${Number(val).toFixed(2)}`;
	}

	const catMap = $derived(Object.fromEntries(data.categories.map(c => [c.id, c.name])));
</script>

<svelte:head>
	<title>Medicines – Admin</title>
</svelte:head>

<div class="p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Medicines</h1>
			<p class="text-sm text-gray-500 mt-0.5">{data.medicines.length} products</p>
		</div>
		<a href="/admin/medicines/new" class="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors text-sm">
			<Plus size={18} /> Add Medicine
		</a>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex flex-wrap gap-3">
		<form onsubmit={search} class="flex gap-2 flex-1">
			<div class="relative flex-1">
				<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
				<input type="search" bind:value={searchQ} placeholder="Search medicines…" class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500" />
			</div>
			<button type="submit" class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">Search</button>
		</form>
		<a href="/admin/medicines?filter=low_stock" class="inline-flex items-center gap-1.5 text-sm border border-amber-300 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors">
			<AlertTriangle size={15} /> Low Stock ({data.medicines.filter(m => m.stockQuantity <= m.minStockAlert).length})
		</a>
	</div>

	<!-- Table -->
	<div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 border-b border-gray-100">
					<tr>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Photo</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Medicine</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
						<th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-50">
					{#each data.medicines as med}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3">
								<div class="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
									{#if med.imageUrl}<img src={med.imageUrl} alt="{med.name} pack" class="w-full h-full object-contain" />{:else}<span class="text-[10px] text-gray-400">No photo</span>{/if}
								</div>
							</td>
							<td class="px-5 py-3">
								<div class="font-medium text-gray-800">{med.name}</div>
								{#if med.strength}<div class="text-xs text-gray-400">{med.dosageForm} · {med.strength}</div>{/if}
							</td>
							<td class="px-5 py-3 text-gray-500">{catMap[med.categoryId] ?? '-'}</td>
							<td class="px-5 py-3">
								<div class="font-semibold text-purple-700">{formatPrice(med.discountedPrice)}</div>
								{#if Number(med.price) > Number(med.discountedPrice)}
									<div class="text-xs text-gray-400 line-through">{formatPrice(med.price)}</div>
								{/if}
							</td>
							<td class="px-5 py-3">
								<span class="font-medium {med.stockQuantity <= med.minStockAlert ? 'text-red-600' : 'text-gray-800'}">{med.stockQuantity}</span>
								{#if med.stockQuantity <= med.minStockAlert}
									<AlertTriangle size={12} class="inline text-amber-500 ml-1" />
								{/if}
							</td>
							<td class="px-5 py-3">
								{#if med.requiresPrescription}
									<span class="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Rx</span>
								{:else}
									<span class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">OTC</span>
								{/if}
							</td>
							<td class="px-5 py-3">
								<form method="post" action="?/toggleActive" use:enhance>
									<input type="hidden" name="id" value={med.id} />
									<button type="submit" class="text-xs font-medium px-2.5 py-0.5 rounded-full {med.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
										{med.isActive ? 'Active' : 'Inactive'}
									</button>
								</form>
							</td>
							<td class="px-5 py-3 text-right">
								<a href="/admin/medicines/{med.id}/edit" class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors">
									<Edit size={12} /> Edit
								</a>
							</td>
						</tr>
					{/each}
					{#if data.medicines.length === 0}
						<tr><td colspan="8" class="px-5 py-10 text-center text-gray-400">No medicines found.</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
