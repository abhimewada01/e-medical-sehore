<script lang="ts">
	import type { PageData } from './$types';
	import { QrCode, Users, Package, CheckCircle, Clock, XCircle, Copy, ExternalLink } from 'lucide-svelte';

	let { data }: {  data: PageData  } = $props();
	let { doctor, referralUrl, qrCodeDataUrl, stats } = $derived(data);
	let copied = $state(false);

	function copyLink() {
		navigator.clipboard.writeText(referralUrl).then(() => {
			copied = true;
			setTimeout(() => (copied = false), 2000);
		});
	}

	const statusColors: Record<string, string> = {
		PENDING: 'bg-yellow-100 text-yellow-700',
		VERIFIED: 'bg-green-100 text-green-700',
		REJECTED: 'bg-red-100 text-red-700'
	};
</script>

<svelte:head>
	<title>Doctor Dashboard – E-Medical Sehore</title>
</svelte:head>

<div class="p-6 max-w-5xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-800">Hello, Dr. {data.user?.fullName?.split(' ').slice(-1)[0]} 👋</h1>
		<p class="text-gray-500 text-sm mt-1">{doctor.specialization} · {doctor.clinicName}</p>
	</div>

	<!-- Verification banner -->
	{#if doctor.verificationStatus === 'PENDING'}
		<div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-amber-700 text-sm flex items-center gap-2">
			⏳ Your license is pending verification by the pharmacy admin. Features may be limited until verified.
		</div>
	{:else if doctor.verificationStatus === 'REJECTED'}
		<div class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-red-600 text-sm">
			❌ Your license verification was rejected. Please contact the pharmacy for assistance.
		</div>
	{/if}

	<!-- Stats -->
	<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
		{#each [
			{ label: 'QR Scans', value: stats.totalScans, icon: QrCode, color: 'blue' },
			{ label: 'Patients Referred', value: stats.totalRegistrations, icon: Users, color: 'purple' },
			{ label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'violet' },
			{ label: 'Completed', value: stats.completedOrders, icon: CheckCircle, color: 'green' },
			{ label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'yellow' },
			{ label: 'Cancelled', value: stats.cancelledOrders, icon: XCircle, color: 'red' }
		] as card}
			<div class="bg-white rounded-2xl border border-gray-100 p-4">
				<div class="w-8 h-8 bg-{card.color}-100 rounded-lg flex items-center justify-center mb-2">
					<card.icon size={16} class="text-{card.color}-600" />
				</div>
				<div class="text-2xl font-bold text-gray-800">{card.value}</div>
				<div class="text-xs text-gray-500">{card.label}</div>
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<!-- QR Code -->
		<div class="bg-white rounded-2xl border border-gray-100 p-6">
			<h2 class="font-bold text-gray-800 mb-1 flex items-center gap-2"><QrCode size={20} class="text-blue-600" /> Your Referral QR Code</h2>
			<p class="text-xs text-gray-500 mb-4">Share this QR code with your patients to refer them to E-Medical Sehore. Each scan is tracked for analytics.</p>

			<div class="flex justify-center mb-4">
				<div class="p-3 bg-white border-2 border-purple-200 rounded-2xl">
					<img src={qrCodeDataUrl} alt="QR Code" class="w-48 h-48" />
				</div>
			</div>

			<div class="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between gap-2 mb-3">
				<code class="text-xs text-gray-600 truncate">{referralUrl}</code>
				<button onclick={copyLink} class="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 flex-shrink-0">
					<Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
				</button>
			</div>

			<div class="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
				<span class="text-xs text-gray-600">Referral Code: <code class="font-bold text-purple-700">{doctor.referralCode}</code></span>
				<a href={referralUrl} target="_blank" class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
					<ExternalLink size={12} /> Preview
				</a>
			</div>
		</div>

		<!-- Profile summary -->
		<div class="bg-white rounded-2xl border border-gray-100 p-6">
			<h2 class="font-bold text-gray-800 mb-4">Profile</h2>
			<div class="space-y-3 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-500">Qualification</span>
					<span class="font-medium text-gray-800">{doctor.qualification}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Specialization</span>
					<span class="font-medium text-gray-800">{doctor.specialization}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">License No.</span>
					<span class="font-medium text-gray-800">{doctor.licenseNumber.startsWith('NOT_PROVIDED-') ? 'Not provided' : doctor.licenseNumber}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Clinic</span>
					<span class="font-medium text-gray-800">{doctor.clinicName}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Phone</span>
					<span class="font-medium text-gray-800">{doctor.phone}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-500">Status</span>
					<span class="text-xs font-medium px-2 py-0.5 rounded-full {statusColors[doctor.verificationStatus] ?? 'bg-gray-100 text-gray-600'}">
						{doctor.verificationStatus}
					</span>
				</div>
			</div>
			<div class="mt-4 pt-4 border-t border-gray-100">
				<a href="/doctor/profile" class="text-sm text-blue-600 hover:text-blue-700 font-medium">Edit Profile →</a>
			</div>
		</div>
	</div>

	<!-- Legal disclaimer -->
	<div class="mt-6 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
		<strong>⚠️ Legal Notice:</strong> Doctor referral analytics are provided for informational purposes only. Financial commissions or incentives linked to prescriptions or medicine referrals require explicit legal and regulatory approval under Indian pharmacy laws and MCI guidelines. No automatic payments are made based on referral activity.
	</div>
</div>
