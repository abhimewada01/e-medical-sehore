<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Coins, Save } from 'lucide-svelte';

	let { data, form }: {  data: PageData; form: ActionData  } = $props();
</script>

<svelte:head>
	<title>Rewards Settings – Admin</title>
</svelte:head>

<div class="p-6 max-w-2xl">
	<div class="flex items-center gap-3 mb-6">
		<Coins size={28} class="text-purple-600" />
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Loyalty Rewards</h1>
			<p class="text-sm text-gray-500">Configure loyalty coin rewards for customers</p>
		</div>
	</div>

	{#if form?.success}
		<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
			Settings saved successfully!
		</div>
	{/if}

	<form method="post" action="?/save" use:enhance>
		<div class="space-y-4">
			{#each data.settings as setting}
				<div class="bg-white rounded-2xl border border-gray-100 p-5">
					<label class="block text-sm font-semibold text-gray-800 mb-1">{setting.description}</label>
					<div class="text-xs text-gray-400 mb-2 font-mono">{setting.key}</div>
					{#if setting.key === 'loyalty_enabled'}
						<div class="flex items-center gap-3">
							<input type="hidden" name={setting.key} value="false" />
							<label class="flex items-center gap-2 cursor-pointer">
								<input type="checkbox" name={setting.key} value="true" checked={setting.value === 'true'} class="w-4 h-4 accent-purple-600" />
								<span class="text-sm text-gray-700">{setting.value === 'true' ? 'Enabled' : 'Disabled'}</span>
							</label>
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<input type="number" name={setting.key} value={setting.value} step="0.01" min="0"
								class="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
							{#if setting.key.includes('percent')}<span class="text-sm text-gray-500">%</span>
							{:else if setting.key.includes('rupee') || setting.key.includes('order')}<span class="text-sm text-gray-500">₹</span>
							{:else if setting.key.includes('days')}<span class="text-sm text-gray-500">days</span>
							{:else}<span class="text-sm text-gray-500">coins</span>{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="mt-6">
			<div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-700">
				⚠️ <strong>Important:</strong> Financial commission payments to doctors are disabled by default. Do not enable referral-linked incentives without obtaining legal and regulatory approval first.
			</div>
			<button type="submit" class="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors">
				<Save size={18} /> Save Settings
			</button>
		</div>
	</form>
</div>
