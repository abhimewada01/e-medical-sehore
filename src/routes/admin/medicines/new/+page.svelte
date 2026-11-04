<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { ArrowLeft, Loader } from 'lucide-svelte';

	let { data, form }: {  data: PageData; form: ActionData  } = $props();
	let submitting = $state(false);

	const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Ointment', 'Injection', 'Drops', 'Inhaler', 'Patch', 'Gel', 'Powder', 'Device', 'Other'];
</script>

<svelte:head>
	<title>Add Medicine – Admin</title>
</svelte:head>

<div class="p-6 max-w-3xl">
	<div class="flex items-center gap-3 mb-6">
		<a href="/admin/medicines" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
			<ArrowLeft size={20} />
		</a>
		<h1 class="text-2xl font-bold text-gray-800">Add Medicine</h1>
	</div>

	{#if form?.error}
		<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{form.error}</div>
	{/if}

	<form method="post" enctype="multipart/form-data" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }} class="space-y-5">
		<div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
			<h2 class="font-bold text-gray-700 text-sm uppercase tracking-wider">Basic Info</h2>
			<div>
				<label for="medicine-image" class="block text-sm font-medium text-gray-700 mb-1">Medicine photo</label>
				<input id="medicine-image" type="file" name="image" accept="image/jpeg,image/png,image/webp" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
				<p class="text-xs text-gray-400 mt-1">JPG, PNG, or WebP; up to 5 MB. Use a photo of the actual product pack.</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
					<input type="text" name="name" required value={form?.values?.name ?? ''} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
					{#if form?.errors?.name}<p class="text-red-500 text-xs mt-1">{form.errors.name[0]}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
					<input type="text" name="genericName" value={form?.values?.genericName ?? ''} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
					<input type="text" name="brandName" value={form?.values?.brandName ?? ''} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
					<select name="categoryId" required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
						<option value="">Select category</option>
						{#each data.categories as cat}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
					{#if form?.errors?.categoryId}<p class="text-red-500 text-xs mt-1">{form.errors.categoryId[0]}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Dosage Form *</label>
					<select name="dosageForm" required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
						{#each dosageForms as form}
							<option value={form}>{form}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Strength</label>
					<input type="text" name="strength" placeholder="e.g. 500mg, 100ml" value={form?.values?.strength ?? ''} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Pack Size</label>
					<input type="text" name="packSize" placeholder="e.g. 10 Tablets / Strip" value={form?.values?.packSize ?? ''} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
					<input type="text" name="manufacturer" value={form?.values?.manufacturer ?? ''} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
			</div>
		</div>

		<div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
			<h2 class="font-bold text-gray-700 text-sm uppercase tracking-wider">Pricing & Stock</h2>
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">MRP (₹) *</label>
					<input type="number" name="price" required min="0" step="0.01" value={form?.values?.price ?? ''} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
					{#if form?.errors?.price}<p class="text-red-500 text-xs mt-1">{form.errors.price[0]}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Sale Price (₹) *</label>
					<input type="number" name="discountedPrice" required min="0" step="0.01" value={form?.values?.discountedPrice ?? ''} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
					{#if form?.errors?.discountedPrice}<p class="text-red-500 text-xs mt-1">{form.errors.discountedPrice[0]}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
					<input type="number" name="stockQuantity" required min="0" value={form?.values?.stockQuantity ?? '0'} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Min Stock Alert</label>
					<input type="number" name="minStockAlert" min="0" value={form?.values?.minStockAlert ?? '10'} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
			</div>
		</div>

		<div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
			<h2 class="font-bold text-gray-700 text-sm uppercase tracking-wider">Flags</h2>
			<div class="flex flex-wrap gap-6">
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" name="requiresPrescription" class="w-4 h-4 accent-purple-600" />
					<span class="text-sm text-gray-700">Requires Prescription</span>
				</label>
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" name="isAgeRestricted" class="w-4 h-4 accent-purple-600" />
					<span class="text-sm text-gray-700">Age-Restricted (18+)</span>
				</label>
			</div>
		</div>

		<div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
			<h2 class="font-bold text-gray-700 text-sm uppercase tracking-wider">Details</h2>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
				<textarea name="description" rows="3" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-y">{form?.values?.description ?? ''}</textarea>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Composition / Salt</label>
				<input type="text" name="composition" value={form?.values?.composition ?? ''} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Usage Instructions</label>
				<textarea name="usageInstructions" rows="2" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-y">{form?.values?.usageInstructions ?? ''}</textarea>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Side Effects</label>
				<textarea name="sideEffects" rows="2" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-y">{form?.values?.sideEffects ?? ''}</textarea>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Storage Instructions</label>
				<input type="text" name="storageInstructions" value={form?.values?.storageInstructions ?? ''} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
			</div>
		</div>

		<div class="flex gap-3">
			<button type="submit" disabled={submitting} class="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60">
				{#if submitting}<Loader size={18} class="animate-spin" />{/if}
				Save Medicine
			</button>
			<a href="/admin/medicines" class="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium">Cancel</a>
		</div>
	</form>
</div>
