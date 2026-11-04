<script lang="ts">
	import { enhance } from '$app/forms';
	import { Loader } from 'lucide-svelte';
	let loading = $state(false);
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
	<div class="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full text-center">
		<div class="text-4xl mb-4">👋</div>
		<h1 class="text-xl font-bold text-gray-800 mb-2">Logging Out</h1>
		<p class="text-gray-500 text-sm mb-6">Are you sure you want to log out?</p>
		<form method="post" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }} class="flex gap-3 justify-center">
			<button type="submit" disabled={loading} class="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
				{#if loading}<Loader size={16} class="animate-spin" />{/if}
				Logout
			</button>
			<a href="/" class="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium">Cancel</a>
		</form>
	</div>
</div>
