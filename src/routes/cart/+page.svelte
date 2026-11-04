<script lang="ts">
	import { ShoppingCart, Trash2, ArrowRight, Upload } from 'lucide-svelte';

	type CartItem = { qty: number; name: string; price: number; rx: boolean; imageUrl?: string | null };
	let cart = $state<Record<string, CartItem>>({});
	let loaded = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const raw = localStorage.getItem('emedCart');
			cart = raw ? JSON.parse(raw) : {};
			loaded = true;
			window.addEventListener('cart-updated', () => {
				const r = localStorage.getItem('emedCart');
				cart = r ? JSON.parse(r) : {};
			});
		}
	});

	const items = $derived(
		Object.entries(cart).map(([id, item]) => ({ id, ...item }))
	);

	const subtotal = $derived(items.reduce((sum, i) => sum + i.price * i.qty, 0));
	const hasRxItems = $derived(items.some(i => i.rx));

	function updateQty(id: string, qty: number) {
		if (qty < 1) {
			removeItem(id);
			return;
		}
		cart = { ...cart, [id]: { ...cart[id], qty } };
		localStorage.setItem('emedCart', JSON.stringify(cart));
		window.dispatchEvent(new CustomEvent('cart-updated'));
	}

	function removeItem(id: string) {
		const newCart = { ...cart };
		delete newCart[id];
		cart = newCart;
		localStorage.setItem('emedCart', JSON.stringify(newCart));
		window.dispatchEvent(new CustomEvent('cart-updated'));
	}

	function clearCart() {
		cart = {};
		localStorage.setItem('emedCart', '{}');
		window.dispatchEvent(new CustomEvent('cart-updated'));
	}
</script>

<svelte:head>
	<title>Cart – E-Medical Sehore</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
		<ShoppingCart size={28} class="text-purple-600" />
		Shopping Cart
		{#if items.length > 0}
			<span class="text-sm font-normal text-gray-400">({items.length} item{items.length !== 1 ? 's' : ''})</span>
		{/if}
	</h1>

	{#if !loaded}
		<div class="text-center py-16 text-gray-400">Loading cart…</div>
	{:else if items.length === 0}
		<div class="text-center py-16">
			<div class="text-6xl mb-4">🛒</div>
			<h2 class="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
			<p class="text-gray-400 mb-6">Browse our medicines and add items to your cart</p>
			<a href="/shop" class="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-sm">
				Shop Medicines
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 space-y-3">
				{#each items as item}
					<div class="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
						<div class="w-16 h-16 bg-purple-50 rounded-xl flex-shrink-0 overflow-hidden border border-purple-100">
							{#if item.imageUrl}<img src={item.imageUrl} alt={item.name} class="w-full h-full object-contain" />{/if}
						</div>
						<div class="flex-1 min-w-0">
							<div class="font-semibold text-gray-800 text-sm truncate">{item.name}</div>
							{#if item.rx}
								<span class="inline-block text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full mt-1">Rx Required</span>
							{/if}
							<div class="text-purple-700 font-bold mt-1">₹{item.price.toFixed(2)} × {item.qty}</div>
						</div>
						<div class="flex items-center gap-2 flex-shrink-0">
							<div class="flex items-center border border-gray-200 rounded-lg overflow-hidden">
								<button onclick={() => updateQty(item.id, item.qty - 1)} class="px-2 py-1 hover:bg-gray-50 text-gray-600 font-bold text-sm">−</button>
								<span class="px-3 py-1 text-sm font-semibold">{item.qty}</span>
								<button onclick={() => updateQty(item.id, item.qty + 1)} class="px-2 py-1 hover:bg-gray-50 text-gray-600 font-bold text-sm">+</button>
							</div>
							<button onclick={() => removeItem(item.id)} class="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
								<Trash2 size={16} />
							</button>
						</div>
					</div>
				{/each}

				<div class="flex justify-end">
					<button onclick={clearCart} class="text-sm text-red-400 hover:text-red-600 flex items-center gap-1">
						<Trash2 size={14} /> Clear cart
					</button>
				</div>
			</div>

			<!-- Summary -->
			<div class="bg-white rounded-2xl border border-gray-100 p-5 h-fit">
				<h2 class="font-bold text-gray-800 mb-4">Order Summary</h2>
				<div class="space-y-2 text-sm mb-4">
					<div class="flex justify-between text-gray-600">
						<span>Subtotal ({items.length} items)</span>
						<span>₹{subtotal.toFixed(2)}</span>
					</div>
					<div class="flex justify-between text-gray-600">
						<span>Delivery Fee</span>
						<span class="text-green-600">{subtotal >= 500 ? 'FREE' : '₹40.00'}</span>
					</div>
					<div class="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-800">
						<span>Total</span>
						<span class="text-purple-700">₹{(subtotal + (subtotal >= 500 ? 0 : 40)).toFixed(2)}</span>
					</div>
				</div>

				{#if hasRxItems}
					<div class="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-xs text-orange-700 flex items-start gap-2">
						<Upload size={14} class="mt-0.5 flex-shrink-0" />
						<span>Your cart contains prescription medicines. You'll need to upload a valid prescription at checkout.</span>
					</div>
				{/if}

				<a href="/checkout" class="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-sm">
					Proceed to Checkout <ArrowRight size={18} />
				</a>
				<a href="/shop" class="mt-3 w-full block text-center text-sm text-purple-600 hover:text-purple-700">
					Continue Shopping
				</a>
			</div>
		</div>
	{/if}
</div>
