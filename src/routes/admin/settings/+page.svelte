<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Settings, Save } from 'lucide-svelte';

	let { data, form }: {  data: PageData; form: ActionData  } = $props();
</script>

<svelte:head>
	<title>Settings – Admin</title>
</svelte:head>

<div class="p-6 max-w-2xl">
	<div class="flex items-center gap-3 mb-6">
		<Settings size={28} class="text-purple-600" />
		<h1 class="text-2xl font-bold text-gray-800">Admin Settings</h1>
	</div>

	{#if form?.success}
		<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">Settings saved!</div>
	{/if}

	<div class="bg-white rounded-2xl border border-gray-100 p-5">
		{#if data.settings.length === 0}
			<p class="text-gray-400 text-sm">No settings configured yet. Set them up via the Rewards page.</p>
		{:else}
			<form method="post" action="?/save" use:enhance class="space-y-4">
				{#each data.settings as s}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">{s.key}</label>
						{#if s.description}<p class="text-xs text-gray-400 mb-1">{s.description}</p>{/if}
						<input type="text" name={s.key} value={s.value} class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
					</div>
				{/each}
				<button type="submit" class="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-700 text-sm">
					<Save size={16} /> Save
				</button>
			</form>
		{/if}
	</div>
</div>
