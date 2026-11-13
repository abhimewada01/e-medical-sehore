<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { User, Save, Loader } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let { doctor, user } = $derived(data);
	let saving = $state(false);
</script>

<svelte:head>
	<title>Doctor Profile - E-Medical Sehore</title>
</svelte:head>

<div class="max-w-2xl p-4 sm:p-6">
	<div class="flex items-center gap-3 mb-6">
		<User size={28} class="text-blue-600" />
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Doctor Profile</h1>
			<p class="text-xs text-gray-400">Manage your clinical and contact information</p>
		</div>
	</div>

	{#if form?.success}
		<div class="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
			Profile updated successfully!
		</div>
	{/if}

	<form method="post" use:enhance={() => { saving = true; return async ({ update }) => { saving = false; await update(); }; }} class="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
		<div>
			<label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">Doctor Name *</label>
			<input id="fullName" type="text" name="fullName" value={user?.fullName} required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
		</div>

		<div>
			<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
			<input id="phone" type="tel" name="phone" value={doctor?.phone} required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div>
				<label for="qualification" class="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
				<input id="qualification" type="text" name="qualification" value={doctor?.qualification} required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
			</div>
			<div>
				<label for="specialization" class="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
				<input id="specialization" type="text" name="specialization" value={doctor?.specialization} required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
			</div>
		</div>

		<div>
			<label for="clinicName" class="block text-sm font-medium text-gray-700 mb-1">Clinic / Hospital Name *</label>
			<input id="clinicName" type="text" name="clinicName" value={doctor?.clinicName} required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
		</div>

		<div>
			<label for="clinicAddress" class="block text-sm font-medium text-gray-700 mb-1">Clinic Address *</label>
			<textarea id="clinicAddress" name="clinicAddress" rows="2" required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">{doctor?.clinicAddress}</textarea>
		</div>

		<div>
			<label for="bio" class="block text-sm font-medium text-gray-700 mb-1">About Doctor (Bio)</label>
			<textarea id="bio" name="bio" rows="3" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500">{doctor?.bio ?? ''}</textarea>
		</div>

		<div class="pt-2">
			<button type="submit" disabled={saving} class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
				{#if saving}<Loader size={18} class="animate-spin" />{/if}
				<Save size={18} /> Save Changes
			</button>
		</div>
	</form>
</div>
