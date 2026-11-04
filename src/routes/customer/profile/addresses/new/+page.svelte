<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { MapPin, ArrowLeft, Loader } from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Add Address - E-Medical Sehore</title>
</svelte:head>

<div class="p-6 max-w-xl mx-auto">
	<div class="flex items-center gap-3 mb-6">
		<a href="/checkout" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
			<ArrowLeft size={20} />
		</a>
		<h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
			<MapPin size={24} class="text-purple-600" /> Add Delivery Address
		</h1>
	</div>

	<form method="post" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }} class="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
		<div>
			<label for="recipientName" class="block text-sm font-medium text-gray-700 mb-1">Recipient Name *</label>
			<input id="recipientName" type="text" name="recipientName" required placeholder="Full Name" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
			{#if form?.errors?.recipientName}<p class="text-red-500 text-xs mt-1">{form.errors.recipientName[0]}</p>{/if}
		</div>

		<div>
			<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Mobile Phone *</label>
			<input id="phone" type="tel" name="phone" required placeholder="10-digit mobile number" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
			{#if form?.errors?.phone}<p class="text-red-500 text-xs mt-1">{form.errors.phone[0]}</p>{/if}
		</div>

		<div>
			<label for="addressLine1" class="block text-sm font-medium text-gray-700 mb-1">House / Flat No., Street, Colony *</label>
			<input id="addressLine1" type="text" name="addressLine1" required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
			{#if form?.errors?.addressLine1}<p class="text-red-500 text-xs mt-1">{form.errors.addressLine1[0]}</p>{/if}
		</div>

		<div>
			<label for="addressLine2" class="block text-sm font-medium text-gray-700 mb-1">Area / Sector</label>
			<input id="addressLine2" type="text" name="addressLine2" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
		</div>

		<div>
			<label for="landmark" class="block text-sm font-medium text-gray-700 mb-1">Nearby Landmark</label>
			<input id="landmark" type="text" name="landmark" placeholder="e.g. Near Bus Stand, Civil Hospital" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
		</div>

		<div class="grid grid-cols-3 gap-3">
			<div>
				<label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
				<input id="city" type="text" name="city" value="Sehore" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
			</div>
			<div>
				<label for="state" class="block text-sm font-medium text-gray-700 mb-1">State</label>
				<input id="state" type="text" name="state" value="Madhya Pradesh" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
			</div>
			<div>
				<label for="postalCode" class="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
				<input id="postalCode" type="text" name="postalCode" value="466001" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
			</div>
		</div>

		<div>
			<label class="flex items-center gap-2 cursor-pointer mt-2">
				<input type="checkbox" name="isDefault" class="w-4 h-4 accent-purple-600 rounded" />
				<span class="text-sm text-gray-700">Set as default delivery address</span>
			</label>
		</div>

		<div class="pt-4 flex gap-3">
			<button type="submit" disabled={loading} class="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
				{#if loading}<Loader size={18} class="animate-spin" />{/if}
				Save Address
			</button>
			<a href="/checkout" class="px-5 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium flex items-center">
				Cancel
			</a>
		</div>
	</form>
</div>
