<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { FileText, CheckCircle, XCircle, MessageCircle, Eye } from 'lucide-svelte';

	let { data }: {  data: PageData  } = $props();
	let verifyingId = $state<string | null>(null);
	let notes = $state('');

	const statusColors: Record<string, string> = {
		PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-700',
		APPROVED: 'bg-green-100 text-green-700',
		REJECTED: 'bg-red-100 text-red-700',
		CLARIFICATION_REQUESTED: 'bg-blue-100 text-blue-700'
	};
</script>

<svelte:head>
	<title>Prescriptions – Admin</title>
</svelte:head>

<div class="p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-gray-800">Prescriptions</h1>
			<p class="text-sm text-gray-500 mt-0.5">Review and verify uploaded prescriptions</p>
		</div>
		<div class="bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium">
			{data.prescriptions.filter(p => p.status === 'PENDING_VERIFICATION').length} pending
		</div>
	</div>

	<div class="space-y-4">
		{#each data.prescriptions as rx}
			<div class="bg-white rounded-2xl border border-gray-100 p-5">
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div>
						<div class="flex items-center gap-2 mb-1">
							<FileText size={18} class="text-purple-600" />
							<span class="font-semibold text-gray-800">{rx.customerName}</span>
							<span class="inline-block text-xs font-medium px-2 py-0.5 rounded-full {statusColors[rx.status] ?? 'bg-gray-100 text-gray-600'}">
								{rx.status.replace(/_/g, ' ')}
							</span>
						</div>
						<div class="text-xs text-gray-400">
							Uploaded: {new Date(rx.createdAt).toLocaleString('en-IN')}
							{#if rx.verifiedAt} · Verified: {new Date(rx.verifiedAt).toLocaleString('en-IN')}{/if}
						</div>
						<div class="text-xs text-gray-500 mt-1">File: {rx.originalFilename}</div>
						{#if rx.pharmacistNotes}
							<div class="text-xs text-blue-600 mt-1">Notes: {rx.pharmacistNotes}</div>
						{/if}
						{#if rx.rejectionReason}
							<div class="text-xs text-red-500 mt-1">Reason: {rx.rejectionReason}</div>
						{/if}
					</div>

					<div class="flex items-center gap-2">
						<!-- View prescription -->
						<a href={rx.fileUrl} target="_blank" class="flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
							<Eye size={15} /> View
						</a>

						{#if rx.status === 'PENDING_VERIFICATION'}
							<button onclick={() => verifyingId = verifyingId === rx.id ? null : rx.id} class="flex items-center gap-1.5 text-sm border border-purple-300 px-3 py-1.5 rounded-lg text-purple-700 hover:bg-purple-50 transition-colors">
								Review
							</button>
						{/if}
					</div>
				</div>

				{#if verifyingId === rx.id}
					<div class="mt-4 pt-4 border-t border-gray-100">
						<form method="post" action="?/verify" use:enhance={() => { verifyingId = null; return async ({ update }) => update(); }}>
							<input type="hidden" name="prescriptionId" value={rx.id} />
							<div class="mb-3">
								<label class="block text-sm font-medium text-gray-700 mb-1">Pharmacist Notes</label>
								<textarea name="notes" bind:value={notes} rows="2" placeholder="Optional notes for the customer…" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 resize-none"></textarea>
							</div>
							<div class="flex gap-2">
								<button type="submit" name="action" value="approve" class="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
									<CheckCircle size={16} /> Approve
								</button>
								<button type="submit" name="action" value="clarify" class="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
									<MessageCircle size={16} /> Request Clarification
								</button>
								<button type="submit" name="action" value="reject" class="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
									<XCircle size={16} /> Reject
								</button>
								<button type="button" onclick={() => verifyingId = null} class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
									Cancel
								</button>
							</div>
						</form>
					</div>
				{/if}
			</div>
		{/each}
		{#if data.prescriptions.length === 0}
			<div class="text-center py-16 text-gray-400">
				<FileText size={40} class="mx-auto mb-3 opacity-30" />
				No prescriptions yet.
			</div>
		{/if}
	</div>
</div>
