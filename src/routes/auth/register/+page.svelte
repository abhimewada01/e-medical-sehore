<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Pill, Eye, EyeOff, Loader } from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();
	let showPassword = $state(false);
	let loading = $state(false);
</script>

<svelte:head>
	<title>Create Account – E-Medical Sehore</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<a href="/" class="inline-flex items-center gap-2 group">
				<div class="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-md">
					<Pill size={22} class="text-white" />
				</div>
				<div class="text-left">
					<div class="font-bold text-purple-700 leading-none">E-Medical</div>
					<div class="text-xs text-gray-500 leading-none">Sehore</div>
				</div>
			</a>
			<h1 class="text-2xl font-bold text-gray-800 mt-6 mb-1">Create Account</h1>
			<p class="text-gray-500 text-sm">Join thousands of customers in Sehore</p>
		</div>

		<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
			{#if form?.error}
				<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
					{form.error}
				</div>
			{/if}

			<form method="post" use:enhance={() => {
				loading = true;
				return async ({ update }) => { loading = false; await update(); };
			}}>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1" for="fullName">Full Name</label>
						<input id="fullName" name="fullName" type="text" required
							value={form?.values?.fullName ?? ''}
							class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm"
							placeholder="Your full name"
						/>
						{#if form?.errors?.fullName}<p class="text-red-500 text-xs mt-1">{form.errors.fullName[0]}</p>{/if}
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1" for="email">Email Address</label>
						<input id="email" name="email" type="email" required
							value={form?.values?.email ?? ''}
							class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm"
							placeholder="you@example.com"
						/>
						{#if form?.errors?.email}<p class="text-red-500 text-xs mt-1">{form.errors.email[0]}</p>{/if}
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1" for="phone">Mobile Number</label>
						<input id="phone" name="phone" type="tel"
							value={form?.values?.phone ?? ''}
							class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm"
							placeholder="10-digit mobile number"
						/>
						{#if form?.errors?.phone}<p class="text-red-500 text-xs mt-1">{form.errors.phone[0]}</p>{/if}
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1" for="password">Password</label>
						<div class="relative">
							<input id="password" name="password" type={showPassword ? 'text' : 'password'} required
								class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 pr-11 text-sm"
								placeholder="At least 8 characters"
							/>
							<button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
								onclick={() => showPassword = !showPassword}>
								{#if showPassword}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
							</button>
						</div>
						{#if form?.errors?.password}<p class="text-red-500 text-xs mt-1">{form.errors.password[0]}</p>{/if}
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1" for="confirmPassword">Confirm Password</label>
						<input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} required
							class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm"
							placeholder="Re-enter password"
						/>
						{#if form?.errors?.confirmPassword}<p class="text-red-500 text-xs mt-1">{form.errors.confirmPassword[0]}</p>{/if}
					</div>
				</div>

				<button type="submit" disabled={loading}
					class="w-full mt-6 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm text-sm">
					{#if loading}<Loader size={18} class="animate-spin" /> Creating Account...{:else}Create Account{/if}
				</button>
			</form>

			<p class="text-center text-sm text-gray-500 mt-6">
				Already have an account?
				<a href="/auth/login" class="text-purple-600 font-medium hover:text-purple-700">Sign In</a>
			</p>
		</div>
	</div>
</div>
