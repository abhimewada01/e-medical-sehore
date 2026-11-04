<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { ArrowLeft, Loader } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);

	const dosageForms = [
		'Tablet',
		'Capsule',
		'Syrup',
		'Cream',
		'Ointment',
		'Injection',
		'Drops',
		'Inhaler',
		'Patch',
		'Gel',
		'Powder',
		'Device',
		'Other'
	];

	const v = $derived({
		name: String(form?.values?.name ?? data.medicine.name),
		genericName: String(form?.values?.genericName ?? data.medicine.genericName ?? ''),
		brandName: String(form?.values?.brandName ?? data.medicine.brandName ?? ''),
		categoryId: String(form?.values?.categoryId ?? data.medicine.categoryId),
		dosageForm: String(form?.values?.dosageForm ?? data.medicine.dosageForm),
		strength: String(form?.values?.strength ?? data.medicine.strength ?? ''),
		packSize: String(form?.values?.packSize ?? data.medicine.packSize ?? ''),
		manufacturer: String(form?.values?.manufacturer ?? data.medicine.manufacturer ?? ''),
		price: String(form?.values?.price ?? data.medicine.price),
		discountedPrice: String(form?.values?.discountedPrice ?? data.medicine.discountedPrice),
		stockQuantity: String(form?.values?.stockQuantity ?? data.medicine.stockQuantity),
		minStockAlert: String(form?.values?.minStockAlert ?? data.medicine.minStockAlert),
		description: String(form?.values?.description ?? data.medicine.description ?? ''),
		composition: String(form?.values?.composition ?? data.medicine.composition ?? ''),
		usageInstructions: String(form?.values?.usageInstructions ?? data.medicine.usageInstructions ?? ''),
		sideEffects: String(form?.values?.sideEffects ?? data.medicine.sideEffects ?? ''),
		storageInstructions: String(form?.values?.storageInstructions ?? data.medicine.storageInstructions ?? '')
	});
</script>

<svelte:head>
	<title>Edit {data.medicine.name} – Admin</title>
</svelte:head>

<div class="p-6 max-w-3xl">
	<div class="flex items-center gap-3 mb-6">
		<a href="/admin/medicines" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
			<ArrowLeft size={20} />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Edit Medicine</h1>
			<p class="text-sm text-gray-500">{data.medicine.name}</p>
		</div>
	</div>

	{#if form?.error}
		<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{form.error}</div>
	{/if}

	<form
		method="post"
		enctype="multipart/form-data"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
		class="space-y-5"
	>
		<div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
			<h2 class="font-bold text-gray-700 text-sm uppercase tracking-wider">Basic Info</h2>
			<div class="flex items-center gap-4">
				{#if data.medicine.imageUrl}<img src={data.medicine.imageUrl} alt="Current {data.medicine.name} pack" class="w-20 h-20 rounded-lg border border-gray-200 object-contain bg-white" />{/if}
				<div class="flex-1">
					<label for="medicine-image" class="block text-sm font-medium text-gray-700 mb-1">Medicine photo</label>
					<input id="medicine-image" type="file" name="image" accept="image/jpeg,image/png,image/webp" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
					<p class="text-xs text-gray-400 mt-1">JPG, PNG, or WebP; up to 5 MB. Leave empty to keep the current photo.</p>
				</div>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Medicine Name *</label>
					<input type="text" name="name" required value={v.name} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
					{#if form?.errors?.name}<p class="text-red-500 text-xs mt-1">{form.errors.name[0]}</p>{/if}
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
					<input type="text" name="genericName" value={v.genericName} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
					<input type="text" name="brandName" value={v.brandName} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
					<select name="categoryId" required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
						{#each data.categories as cat}
							<option value={cat.id} selected={cat.id === v.categoryId}>{cat.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Dosage Form *</label>
					<select name="dosageForm" required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
						{#each dosageForms as formName}
							<option value={formName} selected={formName === v.dosageForm}>{formName}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Strength</label>
					<input type="text" name="strength" value={v.strength} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Pack Size</label>
					<input type="text" name="packSize" value={v.packSize} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
					<input type="text" name="manufacturer" value={v.manufacturer} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
			</div>
		</div>

		<div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
			<h2 class="font-bold text-gray-700 text-sm uppercase tracking-wider">Pricing & Stock</h2>
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">MRP (₹) *</label>
					<input type="number" name="price" required min="0" step="0.01" value={v.price} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Sale Price (₹) *</label>
					<input type="number" name="discountedPrice" required min="0" step="0.01" value={v.discountedPrice} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
					<input type="number" name="stockQuantity" required min="0" value={v.stockQuantity} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
					<p class="text-xs text-gray-400 mt-1">Changes are written to the inventory ledger.</p>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Min Stock Alert</label>
					<input type="number" name="minStockAlert" min="0" value={v.minStockAlert} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
				</div>
			</div>
		</div>

		<div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
			<h2 class="font-bold text-gray-700 text-sm uppercase tracking-wider">Flags</h2>
			<div class="flex flex-wrap gap-6">
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" name="requiresPrescription" class="w-4 h-4 accent-purple-600" checked={data.medicine.requiresPrescription} />
					<span class="text-sm text-gray-700">Requires Prescription</span>
				</label>
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" name="isAgeRestricted" class="w-4 h-4 accent-purple-600" checked={data.medicine.isAgeRestricted} />
					<span class="text-sm text-gray-700">Age-Restricted (18+)</span>
				</label>
			</div>
		</div>

		<div class="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
			<h2 class="font-bold text-gray-700 text-sm uppercase tracking-wider">Details</h2>
			<textarea name="description" rows="3" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-y">{v.description}</textarea>
			<input type="text" name="composition" value={v.composition} placeholder="Composition / Salt" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
			<textarea name="usageInstructions" rows="2" placeholder="Usage instructions" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-y">{v.usageInstructions}</textarea>
			<textarea name="sideEffects" rows="2" placeholder="Side effects" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-y">{v.sideEffects}</textarea>
			<input type="text" name="storageInstructions" value={v.storageInstructions} placeholder="Storage instructions" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
		</div>

		<div class="flex gap-3">
			<button type="submit" disabled={submitting} class="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60">
				{#if submitting}<Loader size={18} class="animate-spin" />{/if}
				Save Changes
			</button>
			<a href="/admin/medicines" class="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium">Cancel</a>
		</div>
	</form>
</div>
