<script lang="ts">
	import type { ActionData } from './$types';
	import { Pill, ArrowLeft } from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Forgot Password - E-Medical Sehore</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-6">
			<a href="/" class="inline-flex items-center gap-2 group">
				<div class="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
					<Pill size={22} class="text-white" />
				</div>
				<span class="font-bold text-purple-700 text-lg">E-Medical Sehore</span>
			</a>
			<h1 class="text-2xl font-bold text-gray-800 mt-6 mb-1">Reset Password</h1>
			<p class="text-gray-500 text-sm">Secure account recovery</p>
		</div>

		<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
			<div class="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
				Password reset emails are not enabled for this site yet. For account security, please contact the pharmacy administrator to reset your password.
			</div>
			{#if form?.error}<div class="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">{form.error}</div>{/if}

			<div class="mt-6 text-center">
				<a href="/auth/login" class="text-sm text-gray-500 hover:text-purple-600 flex items-center justify-center gap-1">
					<ArrowLeft size={16} /> Back to Sign In
				</a>
			</div>
		</div>
	</div>
</div>
