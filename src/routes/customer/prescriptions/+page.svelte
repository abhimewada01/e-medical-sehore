<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { Upload, FileText, Eye, Copy, Loader } from 'lucide-svelte';

	let { data, form }: {  data: PageData; form: ActionData  } = $props();
	let uploading = $state(false);
	let dragOver = $state(false);
	let copied = $state('');

	const statusColors: Record<string, string> = {
		PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-700',
		APPROVED: 'bg-green-100 text-green-700',
		REJECTED: 'bg-red-100 text-red-700',
		CLARIFICATION_REQUESTED: 'bg-blue-100 text-blue-700'
	};

	function copyId(id: string) {
		navigator.clipboard.writeText(id);
		copied = id;
		setTimeout(() => (copied = ''), 2000);
	}
</script>

<svelte:head>
	<title>My Prescriptions – E-Medical Sehore</title>
</svelte:head>

<div class="p-6 max-w-3xl mx-auto">
	<h1 class="text-2xl font-bold text-gray-800 mb-2">Prescriptions</h1>
	<p class="text-sm text-gray-500 mb-6">Upload doctor prescriptions to order prescription-only medicines</p>

	{#if form?.success}
		<div class="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
			✅ Prescription uploaded successfully! Your Prescription ID is:
			<div class="mt-2 flex items-center gap-2">
				<code class="bg-green-100 px-3 py-1.5 rounded-lg font-mono text-sm break-all">{form.prescriptionId}</code>
				<button onclick={() => copyId(form.prescriptionId)} class="text-xs text-green-700 hover:text-green-800 border border-green-300 px-2 py-1 rounded-lg flex items-center gap-1">
					<Copy size={12} /> {copied === form.prescriptionId ? 'Copied!' : 'Copy ID'}
				</button>
			</div>
			<p class="mt-2 text-xs text-green-600">Use this ID in checkout when ordering prescription medicines.</p>
		</div>
	{/if}

	{#if form?.error}
		<div class="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{form.error}</div>
	{/if}

	<!-- Upload Form -->
	<div class="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
		<h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><Upload size={18} class="text-purple-600" /> Upload New Prescription</h2>
		<form method="post" action="?/upload" enctype="multipart/form-data"
			use:enhance={() => { uploading = true; return async ({ update }) => { uploading = false; await update(); }; }}>
			<div
				class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center transition-colors {dragOver ? 'border-purple-400 bg-purple-50' : 'hover:border-purple-300'}"
				ondragover={(e) => { e.preventDefault(); dragOver = true; }}
				ondragleave={() => dragOver = false}
				ondrop={(e) => { e.preventDefault(); dragOver = false; }}
			>
				<Upload size={32} class="mx-auto mb-3 text-gray-300" />
				<p class="text-gray-600 font-medium mb-1">Drop your prescription here</p>
				<p class="text-xs text-gray-400 mb-4">JPG, PNG, WebP or PDF · Max 5MB</p>
				<input type="file" name="prescription" accept=".jpg,.jpeg,.png,.webp,.pdf" required class="block mx-auto text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-50 file:text-purple-700 file:text-sm file:font-medium hover:file:bg-purple-100 cursor-pointer" />
			</div>
			<div class="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
				⚠️ <strong>Important:</strong> This prescription will be reviewed by a licensed pharmacist before any prescription-only medicines are dispensed. We never use AI as a substitute for pharmacist verification.
			</div>
			<button type="submit" disabled={uploading} class="mt-4 flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 text-sm">
				{#if uploading}<Loader size={16} class="animate-spin" />{/if}
				Upload Prescription
			</button>
		</form>
	</div>

	<!-- Prescription History -->
	<div class="space-y-3">
		<h2 class="font-bold text-gray-800">Uploaded Prescriptions</h2>
		{#each data.prescriptions as rx}
			<div class="bg-white rounded-2xl border border-gray-100 p-4 flex items-start justify-between gap-4">
				<div class="flex items-start gap-3">
					<div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
						<FileText size={20} class="text-orange-500" />
					</div>
					<div>
						<div class="font-medium text-gray-800 text-sm">{rx.originalFilename}</div>
						<div class="text-xs text-gray-400 mt-0.5">{new Date(rx.createdAt).toLocaleString('en-IN')}</div>
						<span class="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full {statusColors[rx.status] ?? 'bg-gray-100 text-gray-600'}">
							{rx.status.replace(/_/g, ' ')}
						</span>
						{#if rx.pharmacistNotes}<div class="text-xs text-blue-600 mt-1">📝 {rx.pharmacistNotes}</div>{/if}
						{#if rx.rejectionReason}<div class="text-xs text-red-500 mt-1">❌ {rx.rejectionReason}</div>{/if}
					</div>
				</div>
				<div class="flex items-center gap-2 flex-shrink-0">
					<button onclick={() => copyId(rx.id)} class="text-xs text-gray-500 hover:text-purple-600 border border-gray-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:border-purple-300 transition-colors">
						<Copy size={12} /> {copied === rx.id ? 'Copied!' : 'Copy ID'}
					</button>
					<a href={rx.fileUrl} target="_blank" class="text-xs text-purple-600 hover:text-purple-700 border border-purple-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-purple-50 transition-colors">
						<Eye size={12} /> View
					</a>
				</div>
			</div>
		{/each}
		{#if data.prescriptions.length === 0}
			<div class="text-center py-10 text-gray-400 text-sm">No prescriptions uploaded yet.</div>
		{/if}
	</div>
</div>
