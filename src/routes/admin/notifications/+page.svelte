<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Bell, FileText, CheckCheck } from 'lucide-svelte';
	let { data }: { data: PageData } = $props();
	const unreadCount = $derived(data.notifications.filter((item) => !item.isRead).length);
</script>

<svelte:head><title>Notifications – Admin</title></svelte:head>

<main class="mx-auto max-w-4xl p-4 sm:p-6">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
		<div><h1 class="text-2xl font-bold text-gray-900">Notifications</h1><p class="mt-1 text-sm text-gray-500">Prescription uploads and pharmacy updates for your account.</p></div>
		{#if unreadCount > 0}
			<form method="POST" action="?/markRead" use:enhance>
				<button class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><CheckCheck size={16} /> Mark all read</button>
			</form>
		{/if}
	</div>

	{#if data.notifications.length === 0}
		<div class="rounded-2xl border border-gray-100 bg-white p-10 text-center">
			<Bell size={28} class="mx-auto mb-3 text-gray-300" /><h2 class="font-semibold text-gray-800">You’re all caught up</h2><p class="mt-1 text-sm text-gray-500">New prescription uploads will appear here.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.notifications as item (item.id)}
				<article class="flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-4 sm:p-5 {item.isRead ? 'border-gray-100 bg-white' : 'border-emerald-200 bg-emerald-50/60'}">
					<div class="flex min-w-0 gap-3">
						<span class="rounded-xl bg-white p-2 text-emerald-700"><FileText size={19} /></span>
						<div><h2 class="font-semibold text-gray-900">{item.title}</h2><p class="mt-1 text-sm text-gray-600">{item.message}</p><time class="mt-2 block text-xs text-gray-400">{new Date(item.createdAt).toLocaleString('en-IN')}</time></div>
					</div>
					<div class="flex items-center gap-3">
						{#if !item.isRead}<form method="POST" action="?/markRead" use:enhance><input type="hidden" name="notificationId" value={item.id} /><button class="text-xs font-medium text-gray-500 hover:text-gray-800">Mark read</button></form>{/if}
						<a href={item.link || '/admin/prescriptions'} class="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">View</a>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</main>
