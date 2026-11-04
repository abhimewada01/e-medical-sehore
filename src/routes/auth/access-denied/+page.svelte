<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, LockKeyhole, LogOut } from 'lucide-svelte';

	const area = $derived(page.url.searchParams.get('area') ?? 'account');
	const accountType = $derived(area === 'customer' ? 'customer' : area === 'doctor' ? 'doctor' : area === 'admin' ? 'admin' : 'requested');
</script>

<svelte:head>
	<title>Sign in with the right account – E-Medical Sehore</title>
</svelte:head>

<main class="min-h-[70vh] bg-violet-50 flex items-center justify-center p-6">
	<section class="w-full max-w-lg rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-sm">
		<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
			<LockKeyhole size={26} />
		</div>
		<h1 class="text-2xl font-bold text-slate-900">{area === 'customer' ? 'Customer account required' : `${accountType[0].toUpperCase()}${accountType.slice(1)} account required`}</h1>
		<p class="mt-3 text-sm leading-6 text-slate-600">
			This page is only available to a {accountType} account. You are signed in with a different account. Log out, then sign in or create the correct account.
		</p>
		<div class="mt-6 flex flex-wrap justify-center gap-3">
			<a href="/auth/logout" class="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700">
				<LogOut size={17} /> Log out to switch accounts
			</a>
			<a href="/" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
				<ArrowLeft size={17} /> Go to home
			</a>
		</div>
		{#if area === 'customer'}
			<p class="mt-5 text-xs text-slate-500">After logout, choose Create Account for a new customer, or Sign In for an existing customer.</p>
		{/if}
	</section>
</main>
