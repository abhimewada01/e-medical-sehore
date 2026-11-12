<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Pill } from 'lucide-svelte';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Choose a new password – E-Medical Sehore</title></svelte:head>
<main class="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
	<section class="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
		<div class="mb-6 text-center"><div class="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-purple-600 text-white"><Pill size={22}/></div><h1 class="text-2xl font-bold text-gray-900">Choose a new password</h1><p class="mt-1 text-sm text-gray-500">The reset link expires after 30 minutes and works once.</p></div>
		{#if !data.tokenValid}<p role="alert" class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">This reset link is invalid or expired. <a class="font-semibold underline" href="/auth/forgot-password">Request a new link</a>.</p>
		{:else}
			{#if form?.error}<p role="alert" class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{form.error}</p>{/if}
			<form method="POST" use:enhance class="space-y-4">
				<input type="hidden" name="token" value={form?.token ?? data.token}/>
				<label class="block text-sm font-medium text-gray-700">New password<input name="password" type="password" minlength="8" maxlength="100" autocomplete="new-password" required class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"/></label>
				<label class="block text-sm font-medium text-gray-700">Confirm password<input name="confirmPassword" type="password" minlength="8" maxlength="100" autocomplete="new-password" required class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5"/></label>
				<button class="w-full rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-700">Update password</button>
			</form>
		{/if}
	</section>
</main>
