<script lang="ts">
	import type { PageData } from './$types';
	import { Images, ImageOff, Plus } from 'lucide-svelte';
	let { data }: { data: PageData } = $props();
	const withImages = $derived(data.items.filter((item) => item.imageUrl));
</script>
<svelte:head><title>Content library – Admin</title></svelte:head>
<main class="mx-auto max-w-6xl p-4 sm:p-6">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-3"><div class="flex items-start gap-3"><span class="rounded-xl bg-sky-100 p-3 text-sky-700"><Images size={22}/></span><div><h1 class="text-2xl font-bold text-gray-900">Content library</h1><p class="mt-1 text-sm text-gray-500">Browse medicine photos used across the shop.</p></div></div><a href="/admin/medicines/new" class="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16}/> Add medicine</a></div>
	<div class="mb-4 flex gap-3 text-sm"><span class="rounded-full bg-white px-3 py-1.5">{withImages.length} with image</span><span class="rounded-full bg-white px-3 py-1.5">{data.items.length - withImages.length} need an image</span></div>
	{#if withImages.length === 0}<div class="rounded-2xl bg-white p-10 text-center"><ImageOff size={28} class="mx-auto mb-3 text-gray-300"/><h2 class="font-semibold">No medicine images yet</h2><p class="mt-1 text-sm text-gray-500">Add a photo while creating or editing a medicine to build this library.</p></div>{:else}<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{#each withImages as item (item.id)}<a href="/admin/medicines/{item.id}/edit" class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div class="aspect-square bg-gray-50"><img src={item.imageUrl!} alt={item.name} loading="lazy" class="h-full w-full object-cover"/></div><div class="p-3"><div class="truncate text-sm font-semibold text-gray-900">{item.name}</div><div class="mt-1 truncate text-xs text-gray-500">{item.categoryName ?? 'Uncategorized'} · {item.isActive ? 'Live' : 'Hidden'}</div></div></a>{/each}</div>{/if}
</main>
