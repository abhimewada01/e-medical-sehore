<script lang="ts">
	import { Download, FileSpreadsheet } from 'lucide-svelte';
	const reports = [
		{ key: 'orders', title: 'Orders report', description: 'Order totals, status, payment and fulfillment details.' },
		{ key: 'payments', title: 'Payments report', description: 'Payment and refund records with order references.' },
		{ key: 'users', title: 'Users report', description: 'Account directory, roles, access status and join date.' },
		{ key: 'inventory', title: 'Medicine inventory report', description: 'Current stock, price, category and active status.' }
	];
</script>
<svelte:head><title>Reports – Admin</title></svelte:head>
<main class="mx-auto max-w-5xl p-4 sm:p-6"><div class="mb-6 flex items-start gap-3"><span class="rounded-xl bg-amber-100 p-3 text-amber-700"><FileSpreadsheet size={22}/></span><div><h1 class="text-2xl font-bold text-gray-900">Reports & exports</h1><p class="mt-1 text-sm text-gray-500">Download current records as spreadsheet-ready CSV files.</p></div></div><div class="grid gap-4 sm:grid-cols-2">{#each reports as report}<section class="flex flex-col justify-between gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div><h2 class="font-semibold text-gray-900">{report.title}</h2><p class="mt-1 text-sm text-gray-500">{report.description}</p></div><a href="/admin/reports/{report.key}.csv" class="inline-flex w-fit items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"><Download size={16}/> Download CSV</a></section>{/each}</div></main>
