<script lang="ts">
	import type { LayoutData } from './$types';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { data, children }: {  data: LayoutData; children: import("svelte").Snippet  } = $props();
</script>

<div class="min-h-screen flex flex-col bg-white">
	<Navbar user={data.user} />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>

<style>
	@media(max-width:760px){:global(footer){padding-bottom:82px!important}}
</style>
