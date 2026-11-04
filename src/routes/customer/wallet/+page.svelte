<script lang="ts">
	import type { PageData } from './$types';
	import { Coins, TrendingUp, TrendingDown, Info } from 'lucide-svelte';

	let { data }: {  data: PageData  } = $props();
	let { wallet, transactions } = $derived(data);

	const coinValueRupees = 0.1;
	const txColors: Record<string, string> = {
		CREDIT_ORDER: 'text-green-600',
		DEBIT_REDEMPTION: 'text-red-500',
		REVERSAL_REFUND: 'text-orange-500',
		EXPIRY_DEBIT: 'text-gray-400',
		ADMIN_ADJUSTMENT: 'text-blue-600'
	};
</script>

<svelte:head>
	<title>My Wallet – E-Medical Sehore</title>
</svelte:head>

<div class="p-6 max-w-3xl mx-auto">
	<h1 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
		<Coins size={28} class="text-purple-600" /> Reward Wallet
	</h1>

	<!-- Balance Card -->
	<div class="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-6 text-white mb-6">
		<div class="flex items-start justify-between mb-4">
			<div>
				<div class="text-purple-100 text-sm mb-1">Available Coins</div>
				<div class="text-5xl font-bold">{wallet?.balanceCoins ?? 0}</div>
				<div class="text-purple-200 text-sm mt-1">≈ ₹{((wallet?.balanceCoins ?? 0) * coinValueRupees).toFixed(2)} value</div>
			</div>
			<div class="bg-white/20 rounded-2xl p-3">
				<Coins size={28} class="text-white" />
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
			<div>
				<div class="text-purple-200 text-xs">Total Earned</div>
				<div class="text-white font-bold text-xl">{wallet?.totalEarnedCoins ?? 0}</div>
			</div>
			<div>
				<div class="text-purple-200 text-xs">Total Redeemed</div>
				<div class="text-white font-bold text-xl">{wallet?.totalRedeemedCoins ?? 0}</div>
			</div>
		</div>
	</div>

	<!-- How it works -->
	<div class="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-700 flex items-start gap-3">
		<Info size={18} class="mt-0.5 flex-shrink-0" />
		<div>
			<strong>How it works:</strong> Earn coins on eligible online orders. Coins expire in 30 days. Use coins at checkout to get discounts. 1 coin = ₹{coinValueRupees}.
		</div>
	</div>

	<!-- Transaction History -->
	<div>
		<h2 class="font-bold text-gray-800 mb-4">Transaction History</h2>
		{#if transactions.length === 0}
			<div class="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-400 text-sm">
				No transactions yet. Place an order to earn coins!
			</div>
		{:else}
			<div class="space-y-2">
				{#each transactions as tx}
					<div class="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="w-9 h-9 rounded-xl flex items-center justify-center {tx.coins > 0 ? 'bg-green-100' : 'bg-red-50'}">
								{#if tx.coins > 0}
									<TrendingUp size={18} class="text-green-600" />
								{:else}
									<TrendingDown size={18} class="text-red-500" />
								{/if}
							</div>
							<div>
								<div class="text-sm font-medium text-gray-800">{tx.type.replace(/_/g, ' ')}</div>
								{#if tx.referenceNote}<div class="text-xs text-gray-400">{tx.referenceNote}</div>{/if}
								<div class="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</div>
								{#if tx.expiresAt && !tx.isExpired}
									<div class="text-xs text-orange-500">Expires: {new Date(tx.expiresAt).toLocaleDateString('en-IN')}</div>
								{/if}
							</div>
						</div>
						<div class="text-right">
							<div class="font-bold {txColors[tx.type] ?? 'text-gray-700'}">{tx.coins > 0 ? '+' : ''}{tx.coins} coins</div>
							<div class="text-xs text-gray-400">Balance: {tx.newBalance}</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
