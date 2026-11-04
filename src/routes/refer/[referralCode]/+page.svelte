<script lang="ts">
	import type { PageData } from './$types';
	import { Stethoscope, ShoppingBag, ArrowRight, Shield } from 'lucide-svelte';

	let { data }: {  data: PageData  } = $props();
	let { doctor } = $derived(data);
</script>

<svelte:head>
	<title>Referred by {doctor.clinicName} – E-Medical Sehore</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
	<div class="max-w-md w-full">
		<!-- Doctor Card -->
		<div class="bg-white rounded-3xl shadow-xl p-8 text-center mb-6">
			<div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
				<Stethoscope size={36} class="text-white" />
			</div>
			<div class="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-2">Referred by</div>
			<h1 class="text-2xl font-bold text-gray-800 mb-1">{doctor.clinicName}</h1>
			<p class="text-gray-500 text-sm mb-4">{doctor.specialization}</p>

			<div class="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
				Your doctor shared this E-Medical link with you. Browse medicines, then choose home delivery or store pickup at checkout.
			</div>

			<div class="space-y-3">
				<a href="/shop" class="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-700 transition-colors">
					<ShoppingBag size={20} /> Browse Medicines
				</a>
				<a href="/auth/register" class="w-full flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-700 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
					Create Account <ArrowRight size={18} />
				</a>
			</div>
		</div>

		<!-- E-Medical Branding -->
		<div class="bg-white rounded-2xl p-5 text-center">
			<div class="font-bold text-purple-700 text-lg mb-1">E-Medical Sehore</div>
			<p class="text-xs text-gray-500">India's trusted digital pharmacy platform</p>
			<div class="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
				<span>✓ Genuine Medicines</span>
				<span>✓ Fast Delivery</span>
				<span>✓ Secure Payments</span>
			</div>
		</div>

		<!-- Legal Notice -->
		<div class="mt-4 text-center text-xs text-gray-400 flex items-start gap-1 justify-center">
			<Shield size={12} class="mt-0.5 flex-shrink-0" />
			<span>This referral is for informational purposes. No prescription is implied. Always consult your doctor before purchasing medicines.</span>
		</div>
	</div>
</div>
