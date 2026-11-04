<script lang="ts">
	import type { PageData } from './$types';
	import { ShoppingCart, Pill, Stethoscope, Truck, Clock, Shield, ChevronRight, Upload, Star } from 'lucide-svelte';

	let { data }: {  data: PageData  } = $props();

	function addToCart(med: PageData['featuredMedicines'][number], event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		let cart: Record<string, { qty: number; name: string; price: number; rx: boolean; imageUrl?: string | null }>;
		try { cart = JSON.parse(localStorage.getItem('emedCart') || '{}'); } catch { cart = {}; }
		if (cart[med.id]) cart[med.id].qty += 1;
		else cart[med.id] = { qty: 1, name: med.name, price: Number(med.discountedPrice), rx: med.requiresPrescription, imageUrl: med.imageUrl };
		localStorage.setItem('emedCart', JSON.stringify(cart));
		window.dispatchEvent(new CustomEvent('cart-updated'));
	}

	const categoryIcons: Record<string, string> = {
		'tablets': '💊',
		'syrups': '🧪',
		'vitamins': '🌿',
		'skincare': '✨',
		'baby-care': '🍼',
		'devices': '🩺',
		'wellness': '🧘',
		'default': '💉'
	};
</script>

<svelte:head>
	<title>E-Medical Sehore – Online Pharmacy | Medicines Delivered to Your Door</title>
	<meta name="description" content="Order medicines online in Sehore, Madhya Pradesh. Fast delivery, genuine medicines, doctor consultations, and prescription upload." />
</svelte:head>

<!-- Hero Section -->
<section class="relative bg-gradient-to-br from-purple-800 via-purple-700 to-indigo-600 text-white overflow-hidden">
	<div class="absolute inset-0 opacity-10">
		<div class="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
		<div class="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
	</div>
	<div class="relative max-w-7xl mx-auto px-4 py-20 sm:py-28">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
			<div>
				<div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-sm mb-6">
					<span class="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></span>
					Now Delivering in Sehore & Nearby Areas
				</div>
				<h1 class="text-4xl sm:text-5xl font-bold leading-tight mb-6">
					Your Health,<br />
					<span class="text-amber-300">Our Priority</span>
				</h1>
				<p class="text-lg text-purple-100 mb-8 max-w-lg">
					Order medicines online, consult doctors, and get doorstep delivery across Sehore. 
					Genuine medicines • Fast delivery • 24/7 support
				</p>
				<div class="flex flex-wrap gap-4">
					<a href="/shop" class="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-6 py-3 rounded-full hover:bg-purple-50 transition-colors shadow-lg">
						<ShoppingCart size={20} />
						Order Medicines
					</a>
					<a href="/customer/prescriptions" class="inline-flex items-center gap-2 border-2 border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors">
						<Upload size={20} />
						Upload Prescription
					</a>
				</div>
				<div class="mt-10 grid grid-cols-3 gap-6">
					{#each [['1000+', 'Medicines'], ['30 min', 'Avg Delivery'], ['4.8★', 'Rating']] as [num, label]}
						<div class="text-center">
							<div class="text-2xl font-bold text-amber-300">{num}</div>
							<div class="text-sm text-purple-100">{label}</div>
						</div>
					{/each}
				</div>
			</div>
			<div class="hidden lg:flex justify-center">
				<div class="relative">
					<div class="w-80 h-80 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl">
						<div class="text-center">
						<div class="w-40 h-40 rounded-3xl border border-dashed border-white/40 bg-white/10" aria-hidden="true"></div>
							<div class="text-white font-semibold text-xl">E-Medical Sehore</div>
							<div class="text-purple-200 text-sm mt-1">Digital Pharmacy Platform</div>
						</div>
					</div>
					<div class="absolute -top-4 -right-4 bg-amber-400 text-purple-950 text-xs font-bold px-3 py-1 rounded-full shadow-md">
						Free Delivery ₹500+
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Search Bar -->
<section class="bg-white shadow-md sticky top-16 z-30">
	<div class="max-w-7xl mx-auto px-4 py-4">
		<form action="/shop" method="get" class="flex gap-3">
			<div class="flex-1 relative">
				<input
					type="search"
					name="q"
					placeholder="Search for medicines, vitamins, healthcare products..."
					class="w-full pl-5 pr-4 py-3 border-2 border-purple-200 rounded-full focus:outline-none focus:border-purple-600 text-gray-700"
				/>
			</div>
			<button type="submit" class="bg-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors">
				Search
			</button>
		</form>
	</div>
</section>

<!-- Categories -->
<section class="max-w-7xl mx-auto px-4 py-12">
	<h2 class="text-2xl font-bold text-gray-800 mb-6">Shop by Category</h2>
	<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
		{#each data.categories.length > 0 ? data.categories : [
			{ id: '1', slug: 'tablets', name: 'Tablets', iconName: 'Pill' },
			{ id: '2', slug: 'syrups', name: 'Syrups', iconName: 'Beaker' },
			{ id: '3', slug: 'vitamins', name: 'Vitamins', iconName: 'Leaf' },
			{ id: '4', slug: 'skincare', name: 'Skincare', iconName: 'Sparkles' },
			{ id: '5', slug: 'baby-care', name: 'Baby Care', iconName: 'Baby' },
			{ id: '6', slug: 'devices', name: 'Devices', iconName: 'Stethoscope' },
			{ id: '7', slug: 'wellness', name: 'Wellness', iconName: 'Heart' }
		] as category}
			<a href="/shop?category={category.slug}" class="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-purple-300 hover:shadow-md transition-all group">
				<div class="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl group-hover:bg-purple-100 transition-colors">
					{categoryIcons[category.slug] ?? categoryIcons['default']}
				</div>
				<span class="text-xs font-medium text-gray-600 text-center leading-tight">{category.name}</span>
			</a>
		{/each}
	</div>
</section>

<!-- Featured Medicines -->
{#if data.featuredMedicines.length > 0}
<section class="max-w-7xl mx-auto px-4 pb-12">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-2xl font-bold text-gray-800">Featured Medicines</h2>
		<a href="/shop" class="text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1">
			View All <ChevronRight size={16} />
		</a>
	</div>
	<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
		{#each data.featuredMedicines as med}
			<a href="/shop/{med.id}" class="bg-white rounded-2xl border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all overflow-hidden group">
				<div class="aspect-square bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
					{#if med.imageUrl}
						<img src={med.imageUrl} alt={med.name} class="w-full h-full object-cover rounded-xl" />
					{:else}
						<div class="w-full h-full rounded-xl border border-dashed border-purple-200 bg-white/70" aria-label="No product photo added"></div>
					{/if}
				</div>
				<div class="p-3">
					<div class="text-xs text-purple-600 font-medium mb-1">{med.dosageForm}</div>
					<h3 class="font-semibold text-gray-800 text-sm line-clamp-2 leading-tight mb-2">{med.name}</h3>
					{#if med.strength}
						<div class="text-xs text-gray-500 mb-2">{med.strength}</div>
					{/if}
					<div class="flex items-center justify-between">
						<div>
							<span class="text-purple-700 font-bold">₹{Number(med.discountedPrice).toFixed(2)}</span>
							{#if Number(med.price) > Number(med.discountedPrice)}
								<span class="text-xs text-gray-400 line-through ml-1">₹{Number(med.price).toFixed(2)}</span>
							{/if}
						</div>
						{#if med.requiresPrescription}
							<span class="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Rx</span>
						{/if}
					</div>
					{#if med.stockQuantity === 0}
						<div class="mt-2 text-xs text-red-500 font-medium">Out of Stock</div>
					{:else}
						<button onclick={(e) => addToCart(med, e)} class="mt-2 w-full bg-purple-600 text-white text-sm py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
							Add to Cart
						</button>
					{/if}
				</div>
			</a>
		{/each}
	</div>
</section>
{/if}

<!-- How It Works -->
<section class="bg-gradient-to-br from-purple-50 to-indigo-50 py-16">
	<div class="max-w-7xl mx-auto px-4">
		<h2 class="text-2xl font-bold text-gray-800 text-center mb-12">How It Works</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			{#each [
				{ icon: '📱', step: '1', title: 'Browse & Order', desc: 'Search for medicines or upload your prescription. Add items to cart and choose your delivery address.' },
				{ icon: '✅', step: '2', title: 'Verification', desc: 'Our pharmacists verify prescriptions and confirm your order. Pay securely via Razorpay or Cash on Delivery.' },
				{ icon: '🚚', step: '3', title: 'Doorstep Delivery', desc: 'Get medicines delivered to your door in Sehore. Track your order in real time.' }
			] as step}
				<div class="text-center bg-white rounded-2xl p-8 shadow-sm">
					<div class="text-4xl mb-4">{step.icon}</div>
					<div class="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">{step.step}</div>
					<h3 class="font-bold text-gray-800 text-lg mb-2">{step.title}</h3>
					<p class="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Doctor Referral CTA -->
<section class="max-w-7xl mx-auto px-4 py-16">
	<div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
		<div class="absolute top-0 right-0 text-9xl opacity-10">🩺</div>
		<div class="relative max-w-2xl">
			<div class="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1 text-sm mb-4">
				<Stethoscope size={16} />
				Doctor Partnership Program
			</div>
			<h2 class="text-3xl font-bold mb-4">Are You a Doctor in Sehore?</h2>
			<p class="text-blue-100 mb-6">
				Join our doctor referral network. Share your unique QR code with patients and track medicine purchases. 
				Earn commission on successful referrals and help your patients get genuine medicines fast.
			</p>
			<div class="flex flex-wrap gap-4">
				<a href="/auth/register?role=doctor" class="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-full hover:bg-blue-50 transition-colors">
					Join as Doctor
				</a>
				<a href="/about/doctors" class="inline-flex items-center gap-2 border-2 border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors">
					Learn More
				</a>
			</div>
		</div>
	</div>
</section>

<!-- Features -->
<section class="max-w-7xl mx-auto px-4 pb-16">
	<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
		{#each [
			{ icon: '🛡️', title: 'Genuine Medicines', desc: '100% authentic products from licensed distributors' },
			{ icon: '🔒', title: 'Secure Payments', desc: 'Razorpay secured | COD available' },
			{ icon: '⚡', title: 'Fast Delivery', desc: 'Same day delivery in Sehore city' },
			{ icon: '📞', title: '24/7 Support', desc: 'Pharmacist helpline always available' }
		] as feat}
			<div class="text-center p-6 bg-white rounded-2xl border border-gray-100">
				<div class="text-3xl mb-3">{feat.icon}</div>
				<h3 class="font-semibold text-gray-800 text-sm mb-1">{feat.title}</h3>
				<p class="text-xs text-gray-500">{feat.desc}</p>
			</div>
		{/each}
	</div>
</section>
