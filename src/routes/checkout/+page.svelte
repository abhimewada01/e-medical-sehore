<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { MapPin, CreditCard, Truck, Upload, Coins, ChevronDown, Loader } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type CartItem = { qty: number; name: string; price: number; rx: boolean };
	let cart = $state<Record<string, CartItem>>({});
	let loaded = $state(false);
	let submitting = $state(false);
	let selectedAddressId = $state(data.addresses.find(a => a.isDefault)?.id ?? data.addresses[0]?.id ?? '');
	let paymentMethod = $state<'RAZORPAY' | 'COD'>('COD');
	let fulfillmentType = $state<'DELIVERY' | 'PICKUP'>('DELIVERY');
	let redeemCoins = $state(0);
	let discreetPackaging = $state(false);
	let prescriptionId = $state('');

	onMount(() => {
		const raw = localStorage.getItem('emedCart');
		cart = raw ? JSON.parse(raw) : {};
		loaded = true;
	});

	const items = $derived(Object.entries(cart).map(([id, i]) => ({ id, ...i })));
	const hasRxItems = $derived(items.some(i => i.rx));
	const subtotal = $derived(items.reduce((s, i) => s + i.price * i.qty, 0));
	const deliveryFee = $derived(fulfillmentType === 'DELIVERY' && subtotal < 500 ? 40 : 0);
	const coinValueRupees = 0.1;
	const maxCoinsCanRedeem = $derived(Math.min(redeemCoins, data.wallet?.balanceCoins ?? 0));
	const loyaltyDiscount = $derived(maxCoinsCanRedeem * coinValueRupees);
	const grandTotal = $derived(Math.max(0, subtotal + deliveryFee - loyaltyDiscount));
</script>

<svelte:head>
	<title>Checkout – E-Medical Sehore</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

	{#if !loaded}
		<div class="text-center py-16 text-gray-400">Loading…</div>
	{:else if items.length === 0}
		<div class="text-center py-16">
			<p class="text-gray-500 mb-4">Your cart is empty.</p>
			<a href="/shop" class="text-purple-600 font-medium hover:text-purple-700">Go to Shop</a>
		</div>
	{:else}
		<form method="post" action="?/placeOrder" use:enhance={() => {
			submitting = true;
			return async ({ update }) => { submitting = false; await update(); };
		}}>
			<input type="hidden" name="cartJson" value={JSON.stringify(cart)} />
			<input type="hidden" name="paymentMethod" bind:value={paymentMethod} />
			<input type="hidden" name="fulfillmentType" bind:value={fulfillmentType} />
			<input type="hidden" name="redeemCoins" value={redeemCoins} />

			{#if form?.error}
				<div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
					{typeof form.error === 'string' ? form.error : JSON.stringify(form.error)}
				</div>
			{/if}

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div class="lg:col-span-2 space-y-5">
					<!-- Fulfillment choice -->
					<div class="bg-white rounded-2xl border border-gray-100 p-5">
						<h2 class="font-bold text-gray-800 mb-3">How would you like to get your order?</h2>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<button type="button" onclick={() => fulfillmentType = 'DELIVERY'} class="text-left p-4 border rounded-xl {fulfillmentType === 'DELIVERY' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}">
								<div class="font-semibold text-gray-800">Home delivery</div>
								<div class="text-xs text-gray-500 mt-1">We will deliver to your saved address.</div>
							</button>
							<button type="button" onclick={() => fulfillmentType = 'PICKUP'} class="text-left p-4 border rounded-xl {fulfillmentType === 'PICKUP' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}">
								<div class="font-semibold text-gray-800">Pick up at the medical store</div>
								<div class="text-xs text-gray-500 mt-1">Place the order online and show its pickup token at the counter.</div>
							</button>
						</div>
					</div>

					<!-- Address -->
					{#if fulfillmentType === 'DELIVERY'}
					<div class="bg-white rounded-2xl border border-gray-100 p-5">
						<h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><MapPin size={18} class="text-purple-600" /> Delivery Address</h2>
						{#if data.addresses.length === 0}
							<div class="text-sm text-gray-500">
								No saved addresses. <a href="/customer/profile/addresses/new" class="text-purple-600 hover:text-purple-700 font-medium">Add one</a>
							</div>
						{:else}
							<div class="space-y-3">
								{#each data.addresses as addr}
									<label class="flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all {selectedAddressId === addr.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}">
										<input type="radio" name="addressId" value={addr.id} bind:group={selectedAddressId} class="mt-1 accent-purple-600" />
										<div>
											<div class="font-semibold text-gray-800 text-sm">{addr.recipientName}</div>
											<div class="text-gray-500 text-xs mt-0.5">{addr.addressLine1}{addr.addressLine2 ? ', ' + addr.addressLine2 : ''}</div>
											<div class="text-gray-500 text-xs">{addr.city}, {addr.state} - {addr.postalCode}</div>
											<div class="text-gray-500 text-xs">{addr.phone}</div>
											{#if addr.isDefault}<span class="text-xs text-purple-600 font-medium">Default</span>{/if}
										</div>
									</label>
								{/each}
							</div>
						{/if}
					</div>
					{:else}
						<div class="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-800">
							After the pharmacy confirms and prepares your order, show the pickup token on your order page at the medical store counter.
						</div>
					{/if}

					<!-- Prescription upload note -->
					{#if hasRxItems}
						<div class="bg-orange-50 border border-orange-200 rounded-2xl p-5">
							<h2 class="font-bold text-orange-700 mb-2 flex items-center gap-2"><Upload size={18} /> Prescription Required</h2>
							<p class="text-sm text-orange-600 mb-3">Your cart contains prescription medicines. Please go to <a href="/customer/prescriptions" class="underline font-medium">My Prescriptions</a> to upload a prescription first, then come back and enter the prescription ID below.</p>
							<div>
								<label for="prescriptionIdInput" class="block text-xs font-medium text-orange-700 mb-1">Prescription ID (after upload)</label>
								<input id="prescriptionIdInput" type="text" name="prescriptionId" bind:value={prescriptionId} placeholder="paste prescription UUID here" class="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
							</div>
						</div>
					{/if}

					<!-- Payment Method -->
					<div class="bg-white rounded-2xl border border-gray-100 p-5">
						<h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2"><CreditCard size={18} class="text-purple-600" /> Payment Method</h2>
						<div class="space-y-3">
							<label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all {paymentMethod === 'COD' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}">
								<input type="radio" value="COD" bind:group={paymentMethod} class="accent-purple-600" />
								<div>
									<div class="font-semibold text-gray-800 text-sm flex items-center gap-2"><Truck size={16} class="text-gray-500" /> {fulfillmentType === 'PICKUP' ? 'Cash at the medical store' : 'Cash on Delivery'}</div>
									<div class="text-xs text-gray-400">{fulfillmentType === 'PICKUP' ? 'Pay when you collect the order' : 'Pay cash when medicines are delivered'}</div>
								</div>
							</label>
							<label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all {paymentMethod === 'RAZORPAY' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}">
								<input type="radio" value="RAZORPAY" bind:group={paymentMethod} class="accent-purple-600" />
								<div>
									<div class="font-semibold text-gray-800 text-sm flex items-center gap-2">💳 Pay Online (Razorpay)</div>
									<div class="text-xs text-gray-400">UPI, Cards, Net Banking – secure payment</div>
								</div>
							</label>
						</div>
					</div>

					<!-- Loyalty Coins -->
					{#if (data.wallet?.balanceCoins ?? 0) > 0}
						<div class="bg-white rounded-2xl border border-gray-100 p-5">
							<h2 class="font-bold text-gray-800 mb-4 flex items-center gap-2">🪙 Loyalty Coins</h2>
							<p class="text-sm text-gray-500 mb-3">You have <strong>{data.wallet?.balanceCoins}</strong> coins (₹{((data.wallet?.balanceCoins ?? 0) * coinValueRupees).toFixed(2)} value)</p>
							<div class="flex items-center gap-3">
								<input type="number" min="0" max={data.wallet?.balanceCoins ?? 0} bind:value={redeemCoins} class="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-600" />
								<span class="text-sm text-gray-500">coins = ₹{(redeemCoins * coinValueRupees).toFixed(2)} discount</span>
							</div>
						</div>
					{/if}

					<!-- Discreet packaging -->
					<div class="bg-white rounded-2xl border border-gray-100 p-5">
						<label class="flex items-center gap-3 cursor-pointer">
							<input type="checkbox" name="discreetPackaging" bind:checked={discreetPackaging} class="w-4 h-4 accent-purple-600" />
							<div>
								<div class="font-semibold text-gray-800 text-sm">Discreet Packaging</div>
								<div class="text-xs text-gray-400">Contents will not be visible from outside the package</div>
							</div>
						</label>
					</div>
				</div>

				<!-- Summary -->
				<div class="bg-white rounded-2xl border border-gray-100 p-5 h-fit">
					<h2 class="font-bold text-gray-800 mb-4">Order Summary</h2>
					<div class="space-y-2 text-sm mb-4">
						{#each items as item}
							<div class="flex justify-between text-gray-600">
								<span class="truncate max-w-[140px]">{item.name} ×{item.qty}</span>
								<span>₹{(item.price * item.qty).toFixed(2)}</span>
							</div>
						{/each}
						<div class="border-t border-gray-100 pt-2 flex justify-between text-gray-600">
							<span>Delivery</span>
							<span class="text-green-600">{fulfillmentType === 'PICKUP' ? 'Store pickup' : deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
						</div>
						{#if loyaltyDiscount > 0}
							<div class="flex justify-between text-purple-700">
								<span>Coins Discount</span>
								<span>−₹{loyaltyDiscount.toFixed(2)}</span>
							</div>
						{/if}
						<div class="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-800 text-base">
							<span>Total</span>
							<span class="text-purple-700">₹{grandTotal.toFixed(2)}</span>
						</div>
					</div>

					<button
						type="submit"
						disabled={submitting || (fulfillmentType === 'DELIVERY' && !selectedAddressId)}
						class="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
					>
						{#if submitting}
							<Loader size={18} class="animate-spin" /> Placing Order…
						{:else}
							{paymentMethod === 'COD' ? (fulfillmentType === 'PICKUP' ? '🛍️ Place pickup order' : '🚚 Place COD Order') : '💳 Pay & Order'}
						{/if}
					</button>
					<p class="text-xs text-gray-400 mt-3 text-center">By placing this order you agree to our terms of service</p>
				</div>
			</div>
		</form>
	{/if}
</div>
