<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { ShieldCheck } from 'lucide-svelte';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Age eligibility – E-Medical Sehore</title></svelte:head>

<main class="mx-auto max-w-xl p-5 sm:p-8">
	<section class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
		<div class="mb-4 flex items-center gap-3">
			<span class="rounded-xl bg-emerald-50 p-3 text-emerald-700"><ShieldCheck size={22}/></span>
			<div><h1 class="text-xl font-bold text-gray-900">Age eligibility</h1><p class="text-sm text-gray-500">Required for products marked 18+.</p></div>
		</div>
		{#if form?.error}<p role="alert" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{form.error}</p>{/if}
		{#if form?.success}<p role="status" class="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">Your age eligibility is saved.</p>{/if}
		<form method="POST" use:enhance class="space-y-4">
			<label class="block text-sm font-medium text-gray-700" for="dateOfBirth">Date of birth
				<input id="dateOfBirth" name="dateOfBirth" type="date" required value={form?.dateOfBirth ?? data.dateOfBirth} max={new Date().toISOString().slice(0, 10)} class="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2.5" />
			</label>
			<label class="flex items-start gap-2 text-sm text-gray-600"><input type="checkbox" name="confirmAdult" required class="mt-1" />I confirm this date of birth is accurate and understand age-restricted products are only for adults.</label>
			<button class="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800">Save age check</button>
		</form>
		<p class="mt-4 text-xs text-gray-500">This is a self-declared age check. The pharmacy may need to verify age at delivery according to its legal requirements.</p>
	</section>
</main>
