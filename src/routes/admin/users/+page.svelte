<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Users, KeyRound, ShieldCheck } from 'lucide-svelte';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let resetFor = $state('');
	let password = $state('');
</script>
<svelte:head><title>User management – Admin</title></svelte:head>
<main class="mx-auto max-w-6xl p-4 sm:p-6">
	<header class="mb-6 flex items-start gap-3"><span class="rounded-xl bg-violet-100 p-3 text-violet-700"><Users size={22}/></span><div><h1 class="text-2xl font-bold text-gray-900">User management</h1><p class="mt-1 text-sm text-gray-500">{data.users.length} recent accounts · manage access and help users recover accounts.</p></div></header>
	{#if form?.error}<div class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{form.error}</div>{/if}
	{#if form?.passwordReset}<div class="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">Password updated and all existing sessions signed out. Share the new password securely with the user.</div>{/if}
	{#if form?.accessUpdated}<div class="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">Account access updated.</div>{/if}
	{#if data.users.length === 0}<div class="rounded-2xl bg-white p-10 text-center text-gray-500">No user accounts yet.</div>{:else}
		<div class="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm"><table class="w-full min-w-[760px] text-left text-sm"><thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th class="px-4 py-3">User</th><th class="px-4 py-3">Role</th><th class="px-4 py-3">Joined</th><th class="px-4 py-3">Access</th><th class="px-4 py-3">Account help</th></tr></thead><tbody class="divide-y divide-gray-100">
		{#each data.users as person (person.id)}<tr><td class="px-4 py-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">{person.fullName.slice(0,1).toUpperCase()}</div><div><div class="font-semibold text-gray-900">{person.fullName}</div><div class="text-xs text-gray-500">{person.email}{person.phone ? ` · ${person.phone}` : ''}</div></div></div></td><td class="px-4 py-4"><span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">{person.role.replace(/_/g,' ')}</span></td><td class="px-4 py-4 text-gray-500">{new Date(person.createdAt).toLocaleDateString('en-IN')}</td><td class="px-4 py-4"><span class="font-medium {person.isActive ? 'text-green-700' : 'text-red-600'}">{person.isActive ? 'Active' : 'Disabled'}</span></td><td class="px-4 py-4"><div class="flex flex-wrap items-center gap-2">
		{#if data.user?.role === 'SUPER_ADMIN'}
			<form method="POST" action="?/setActive" use:enhance><input type="hidden" name="userId" value={person.id}/><button class="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50">{person.isActive ? 'Disable' : 'Enable'}</button></form>
			{#if resetFor === person.id}<form method="POST" action="?/setPassword" use:enhance class="flex items-center gap-1"><input type="hidden" name="userId" value={person.id}/><input type="password" name="password" bind:value={password} minlength="10" required placeholder="New password" class="w-36 rounded-lg border px-2 py-1.5 text-xs"/><button class="rounded-lg bg-violet-700 px-2 py-1.5 text-xs font-semibold text-white">Save</button></form>{:else}<button onclick={() => { resetFor = person.id; password = ''; }} class="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700"><KeyRound size={13}/> Reset password</button>{/if}
		{:else}<span class="inline-flex items-center gap-1 text-xs text-gray-400"><ShieldCheck size={14}/> Super admin only</span>{/if}
		</div></td></tr>{/each}</tbody></table></div>
	{/if}
	<p class="mt-4 text-xs text-gray-400">Password reset signs the user out of every active session. Passwords are stored as secure hashes.</p>
</main>
