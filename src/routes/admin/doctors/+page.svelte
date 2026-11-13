<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Plus, QrCode, CheckCircle, XCircle } from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showAddForm = $state(false);
	const credentials = $derived((form as any)?.credentials);

	const statusColors: Record<string, string> = {
		PENDING: 'bg-yellow-100 text-yellow-700',
		VERIFIED: 'bg-green-100 text-green-700',
		REJECTED: 'bg-red-100 text-red-700'
	};
</script>

<svelte:head>
	<title>Doctors – Admin</title>
</svelte:head>

	<div class="p-4 sm:p-6">
	<div class="flex flex-wrap items-center justify-between gap-3 mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Doctors</h1>
			<p class="text-sm text-gray-500 mt-0.5">{data.doctors.length} registered doctors</p>
		</div>
		<button onclick={() => showAddForm = !showAddForm} class="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors text-sm">
			<Plus size={18} /> {showAddForm ? 'Cancel' : 'Add Doctor'}
		</button>
	</div>

	{#if showAddForm}
		<div class="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 mb-6">
			<h2 class="font-bold text-gray-800 mb-4">Add New Doctor</h2>
			<p class="-mt-2 mb-4 text-xs text-gray-500">License number, specialization, and bio are not required here. New doctor accounts start as pending review.</p>
			{#if form?.error}<div class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</div>{/if}
			{#if form?.errors}<div class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Please check the required doctor details and submit again.</div>{/if}
			<form method="post" action="?/addDoctor" use:enhance class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="doctor-full-name" class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
					<input id="doctor-full-name" type="text" name="fullName" required autocomplete="name" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label for="doctor-email" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
					<input id="doctor-email" type="email" name="email" required autocomplete="email" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label for="doctor-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
					<input id="doctor-phone" type="tel" name="phone" required autocomplete="tel" inputmode="tel" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label for="doctor-qualification" class="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
					<input id="doctor-qualification" type="text" name="qualification" placeholder="MBBS, MD, etc." required class="w-full border border-gray-200 rounded-xl px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label for="doctor-clinic-name" class="block text-sm font-medium text-gray-700 mb-1">Clinic Name *</label>
					<input id="doctor-clinic-name" type="text" name="clinicName" required autocomplete="organization" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div>
					<label for="doctor-clinic-address" class="block text-sm font-medium text-gray-700 mb-1">Clinic Address *</label>
					<input id="doctor-clinic-address" type="text" name="clinicAddress" required autocomplete="street-address" class="w-full border border-gray-200 rounded-xl px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-purple-500" />
				</div>
				<div class="sm:col-span-2 flex gap-3">
					<button type="submit" class="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">Add Doctor</button>
					<button type="button" onclick={() => showAddForm = false} class="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
				</div>
			</form>
		</div>
	{/if}
	{#if credentials}
		<div class="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-sm text-green-900">
			<h2 class="font-bold mb-2">Doctor account created</h2>
			<p>Share these sign-in details with the doctor. The temporary password is shown here once.</p>
			<div class="mt-3"><strong>Email:</strong> {credentials.email}</div>
			<div><strong>Temporary password:</strong> <code>{credentials.password}</code></div>
			<a class="inline-block mt-2 underline" href="/auth/login">Doctor sign in</a>
			<div class="mt-4 flex flex-wrap items-center gap-4">
				<img src={credentials.qrCodeDataUrl} alt="Doctor referral QR code" class="w-32 h-32 border border-green-200 rounded-lg" />
				<div class="min-w-0">
					<div class="font-semibold">Patient referral link</div>
					<a class="break-all underline" href={credentials.referralUrl}>{credentials.referralUrl}</a>
				</div>
			</div>
		</div>
	{/if}

	<div class="space-y-3 md:hidden">
		{#each data.doctors as doc}
			<article class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<div class="flex items-start gap-3">
					<img src={doc.qrCodeDataUrl} alt="Patient referral QR for {doc.fullName}" class="h-14 w-14 shrink-0 rounded-lg border border-gray-200 p-1" />
					<div class="min-w-0 flex-1">
						<h2 class="truncate font-semibold text-gray-800">{doc.fullName}</h2>
						<p class="break-all text-xs text-gray-500">{doc.email}</p>
						<p class="mt-1 text-sm text-gray-700">{doc.clinicName} · {doc.qualification}</p>
						<p class="truncate text-xs text-gray-500">{doc.phone}</p>
					</div>
				</div>
				<div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
					<span class="rounded-full px-2.5 py-1 font-medium {statusColors[doc.verificationStatus] ?? 'bg-gray-100 text-gray-600'}">{doc.verificationStatus}</span>
					<span class="rounded-full px-2.5 py-1 {doc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">{doc.isActive ? 'Active' : 'Inactive'}</span>
					<span class="text-gray-500">{doc.clientCount} clients</span>
				</div>
				<div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
					<code class="rounded bg-gray-100 px-2 py-1 text-xs">{doc.referralCode}</code>
					<a href={doc.referralUrl} target="_blank" class="text-blue-700 underline">Referral link</a>
					<a href={doc.qrCodeDataUrl} download="{doc.referralCode}-qr.png" class="text-purple-700 underline">Download QR</a>
				</div>
				<div class="mt-4 flex flex-wrap gap-2">
					<form method="post" action="?/toggleStatus" use:enhance><input type="hidden" name="id" value={doc.id} /><button type="submit" class="min-h-10 rounded-lg border border-gray-200 px-3 text-sm font-medium">{doc.isActive ? 'Deactivate' : 'Activate'}</button></form>
					{#if doc.verificationStatus === 'PENDING'}
						<form method="post" action="?/verify" use:enhance class="flex gap-2"><input type="hidden" name="id" value={doc.id} /><button type="submit" name="status" value="VERIFIED" class="min-h-10 rounded-lg border border-green-200 px-3 text-sm font-medium text-green-700">Verify</button><button type="submit" name="status" value="REJECTED" class="min-h-10 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600">Reject</button></form>
					{/if}
				</div>
			</article>
		{/each}
		{#if data.doctors.length === 0}<div class="rounded-2xl border border-gray-100 bg-white px-5 py-10 text-center text-gray-400">No doctors yet.</div>{/if}
	</div>

	<div class="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 border-b border-gray-100">
					<tr>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Doctor</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Clinic</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">License</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Referral Code</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Patient QR</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Clients</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Verification</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
						<th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-50">
					{#each data.doctors as doc}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-5 py-3">
								<div class="font-medium text-gray-800">{doc.fullName}</div>
								<div class="text-xs text-gray-400">{doc.email}</div>
							</td>
							<td class="px-5 py-3">
								<div class="text-gray-700">{doc.clinicName}</div>
								<div class="text-xs text-gray-400">{doc.specialization}</div>
							</td>
							<td class="px-5 py-3 text-gray-600 text-xs">{doc.licenseNumber.startsWith('NOT_PROVIDED-') ? 'Not provided' : doc.licenseNumber}</td>
							<td class="px-5 py-3">
								<code class="text-xs bg-gray-100 px-2 py-0.5 rounded">{doc.referralCode}</code>
							</td>
							<td class="px-5 py-3">
								<a href={doc.qrCodeDataUrl} target="_blank" title="Open QR code full size">
									<img src={doc.qrCodeDataUrl} alt="Patient referral QR for {doc.fullName}" class="w-20 h-20 border border-gray-200 rounded-lg" />
								</a>
								<a href={doc.qrCodeDataUrl} download="{doc.referralCode}-qr.png" class="text-xs text-purple-700 underline">Download QR</a>
								<div><a href={doc.referralUrl} target="_blank" class="text-xs text-blue-700 underline">Referral link</a></div>
							</td>
							<td class="px-5 py-3 font-semibold text-gray-700">{doc.clientCount}</td>
							<td class="px-5 py-3">
								<span class="inline-block text-xs font-medium px-2 py-0.5 rounded-full {statusColors[doc.verificationStatus] ?? 'bg-gray-100 text-gray-600'}">
									{doc.verificationStatus}
								</span>
							</td>
							<td class="px-5 py-3">
								<form method="post" action="?/toggleStatus" use:enhance>
									<input type="hidden" name="id" value={doc.id} />
									<button type="submit" class="text-xs font-medium px-2.5 py-0.5 rounded-full {doc.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
										{doc.isActive ? 'Active' : 'Inactive'}
									</button>
								</form>
							</td>
							<td class="px-5 py-3">
								<div class="flex items-center gap-2">
									{#if doc.verificationStatus === 'PENDING'}
										<form method="post" action="?/verify" use:enhance class="flex gap-1.5">
											<input type="hidden" name="id" value={doc.id} />
											<button type="submit" name="status" value="VERIFIED" class="text-xs text-green-600 border border-green-200 px-2 py-1 rounded-lg hover:bg-green-50 flex items-center gap-1">
												<CheckCircle size={12} /> Verify
											</button>
											<button type="submit" name="status" value="REJECTED" class="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 flex items-center gap-1">
												<XCircle size={12} /> Reject
											</button>
										</form>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
					{#if data.doctors.length === 0}
						<tr><td colspan="9" class="px-5 py-10 text-center text-gray-400">No doctors yet.</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
