<script lang="ts">
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Clock3, Microscope, PackageCheck, Pill, ShieldCheck, Upload, Truck } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	let activeSlide = $state(0);
	let cartCount = $state(0);
	let addedMedicine = $state<Record<string, boolean>>({});

	const slides = [
		{ eyebrow: 'YOUR NEIGHBOURHOOD PHARMACY', title: 'Everyday health,\ncloser to home.', copy: 'Order genuine medicines and wellness essentials from your local Sehore pharmacy.', cta: 'Shop medicines', href: '/shop', tone: 'mint' },
		{ eyebrow: 'A QUICKER WAY TO REFILL', title: 'Your medicines,\non your schedule.', copy: 'Find your regular medicines in a few taps and get them delivered to your door.', cta: 'Browse medicines', href: '/shop', tone: 'rose' },
		{ eyebrow: 'PRESCRIPTION SUPPORT', title: 'Got a prescription?\nWe can help.', copy: 'Share your prescription with our pharmacy team to get started with your order.', cta: 'Upload prescription', href: '/prescriptions/upload', tone: 'blue' }
	];

	const categoryCards = [
		{ slug: 'tablets', label: 'Pharmacy', sub: 'Medicines & more', photo: 0 },
		{ slug: 'devices', label: 'Eye care', sub: 'See a little clearer', photo: 1 },
		{ slug: 'vitamins', label: 'Wellness', sub: 'Everyday health', photo: 2 },
		{ slug: 'baby-care', label: 'Baby care', sub: 'For little ones', photo: 3 },
		{ slug: 'skincare', label: 'Personal care', sub: 'Feel good daily', photo: 5 }
	];
	const topOffers = $derived([...data.featuredMedicines]
		.filter((med) => Number(med.discountedPrice) < Number(med.price))
		.sort((a, b) => (Number(b.price) - Number(b.discountedPrice)) / Number(b.price) - (Number(a.price) - Number(a.discountedPrice)) / Number(a.price))
		.slice(0, 5));

	function discountPercent(med: PageData['featuredMedicines'][number]) {
		const price = Number(med.price);
		return price > 0 ? Math.round(((price - Number(med.discountedPrice)) / price) * 100) : 0;
	}

	function addToCart(med: PageData['featuredMedicines'][number], event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		let cart: Record<string, { qty: number; name: string; price: number; rx: boolean; imageUrl?: string | null }>;
		try { cart = JSON.parse(localStorage.getItem('emedCart') || '{}'); } catch { cart = {}; }
		if (cart[med.id]) cart[med.id].qty += 1;
		else cart[med.id] = { qty: 1, name: med.name, price: Number(med.discountedPrice), rx: med.requiresPrescription, imageUrl: med.imageUrl };
		localStorage.setItem('emedCart', JSON.stringify(cart));
		cartCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
		window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
		addedMedicine[med.id] = true;
		window.setTimeout(() => addedMedicine[med.id] = false, 1600);
	}

	function moveSlide(direction: number) {
		activeSlide = (activeSlide + direction + slides.length) % slides.length;
	}

	onMount(() => {
		const readCart = () => {
			try { cartCount = Object.values(JSON.parse(localStorage.getItem('emedCart') || '{}')).reduce((sum: number, item: any) => sum + (item.qty || 0), 0); } catch { cartCount = 0; }
		};
		readCart();
		window.addEventListener('cart-updated', readCart);
		const timer = window.setInterval(() => moveSlide(1), 6000);
		return () => { window.clearInterval(timer); window.removeEventListener('cart-updated', readCart); };
	});
</script>

<svelte:head>
	<title>E-Medical Sehore — Your neighbourhood online pharmacy</title>
	<meta name="description" content="Order genuine medicines and healthcare essentials online in Sehore. Browse our pharmacy or upload a prescription for support." />
	<meta name="theme-color" content="#ffffff" />
</svelte:head>

<main class="storefront">
	<section class="welcome-strip"><div class="welcome-inner"><span class="open-dot"></span><span>Serving Sehore & nearby areas</span><span class="strip-separator">·</span><span>Care that comes to you</span><a href="/about/doctors">Talk to our care team <ArrowRight size={14} /></a></div></section>

	<section class="search-wrap" aria-label="Search medicines">
		<form action="/shop" method="get" class="search-box">
			<Pill size={20} class="search-pill" aria-hidden="true" />
			<input type="search" name="q" placeholder="Search medicines, brands & more" aria-label="Search medicines, brands and products" />
			<button type="submit" aria-label="Search"><span>Search</span><ArrowRight size={17} /></button>
		</form>
		<p class="search-hint"><ShieldCheck size={14} /> Genuine medicines from trusted distributors</p>
	</section>

	<section class="promo-section" aria-label="Featured promotions">
		<div class="promo-card {slides[activeSlide].tone}" aria-live="polite">
			{#if activeSlide === 0}<img class="promo-photo" src="/pharmacy-hero.png" alt="A friendly pharmacist in a bright pharmacy" />{/if}
			<div class="promo-copy">
				<div class="promo-eyebrow"><span></span>{slides[activeSlide].eyebrow}</div>
				<h1>{slides[activeSlide].title}</h1>
				<p>{slides[activeSlide].copy}</p>
				<a class="promo-cta" href={slides[activeSlide].href}>{slides[activeSlide].cta}<ArrowRight size={17} /></a>
			</div>
			<div class="slide-controls">
				<button class="slide-arrow" aria-label="Previous promotion" onclick={() => moveSlide(-1)}><ChevronLeft size={18} /></button>
				<div class="slide-dots" aria-label="Choose promotion">{#each slides as slide, i}<button class:active={activeSlide === i} aria-label="Promotion {i + 1}: {slide.eyebrow}" aria-current={activeSlide === i ? 'true' : undefined} onclick={() => activeSlide = i}></button>{/each}</div>
				<button class="slide-arrow" aria-label="Next promotion" onclick={() => moveSlide(1)}><ChevronRight size={18} /></button>
			</div>
		</div>
	</section>

	<section class="promise-row" aria-label="Pharmacy benefits">
		<div class="promise"><span class="promise-icon green"><BadgeCheck size={20} /></span><div><strong>Trusted medicines</strong><small>Quality you can count on</small></div></div>
		<div class="promise"><span class="promise-icon orange"><Truck size={20} /></span><div><strong>Local delivery</strong><small>Across Sehore & nearby</small></div></div>
		<div class="promise"><span class="promise-icon blue"><Clock3 size={20} /></span><div><strong>Simple ordering</strong><small>Shop whenever you need</small></div></div>
	</section>

	{#if data.featuredMedicines.length > 0}
	<section class="content-section medicines-section">
		<div class="section-heading"><div><span class="section-kicker">CAREFULLY SELECTED FOR YOU</span><h2>Best Sellers</h2><p>Popular picks from your local pharmacy.</p></div><a class="see-all" href="/shop">Shop all <ArrowRight size={16} /></a></div>
		<div class="medicine-grid shelf-grid">
			{#each data.featuredMedicines.slice(0, 5) as med}
				<div class="medicine-card">
					<a href="/shop/{med.id}" class="medicine-card-link">
						<div class="medicine-image">{#if med.imageUrl}<img src={med.imageUrl} alt={med.name} loading="lazy" />{:else}<div class="medicine-placeholder"><span class="pill-shape"><Pill size={28} /></span><span>Quality healthcare</span></div>{/if}{#if med.requiresPrescription}<span class="rx-tag">Prescription</span>{/if}</div>
						<div class="medicine-title"><span class="medicine-form">{med.dosageForm}{#if med.strength} · {med.strength}{/if}</span><h3>{med.name}</h3></div>
					</a>
					<div class="medicine-info"><div class="price-row"><strong>₹{Number(med.discountedPrice).toFixed(2)}</strong>{#if Number(med.price) > Number(med.discountedPrice)}<del>₹{Number(med.price).toFixed(2)}</del>{/if}</div>{#if med.stockQuantity === 0}<span class="stock-note">Currently unavailable</span>{:else}<button type="button" class="add-button" onclick={(event) => addToCart(med, event)}><span>{addedMedicine[med.id] ? 'Added to cart' : 'Add to cart'}</span><span class="add-plus">{addedMedicine[med.id] ? '✓' : '+'}</span></button>{/if}</div>
				</div>
			{/each}
		</div>
		<a href="/shop" class="mobile-shop-all">Browse all medicines <ArrowRight size={16} /></a>
	</section>
	{/if}

	{#if topOffers.length > 0}
	<section class="content-section offers-section">
		<div class="section-heading"><div><span class="section-kicker">SAVE ON EVERYDAY ESSENTIALS</span><h2>Top Offers</h2><p>Great prices on selected products.</p></div><a class="see-all" href="/shop">View all <ArrowRight size={16} /></a></div>
		<div class="medicine-grid shelf-grid">
			{#each topOffers as med}
				<div class="medicine-card">
					<a href="/shop/{med.id}" class="medicine-card-link">
						<div class="medicine-image">{#if med.imageUrl}<img src={med.imageUrl} alt={med.name} loading="lazy" />{:else}<div class="medicine-placeholder"><span class="pill-shape"><Pill size={28} /></span><span>Quality healthcare</span></div>{/if}{#if med.requiresPrescription}<span class="rx-tag">Prescription</span>{/if}<span class="offer-badge">Save {discountPercent(med)}%</span></div>
						<div class="medicine-title"><span class="medicine-form">{med.dosageForm}{#if med.strength} · {med.strength}{/if}</span><h3>{med.name}</h3></div>
					</a>
					<div class="medicine-info"><div class="price-row"><strong>₹{Number(med.discountedPrice).toFixed(2)}</strong><del>₹{Number(med.price).toFixed(2)}</del></div><button type="button" class="add-button" onclick={(event) => addToCart(med, event)}><span>{addedMedicine[med.id] ? 'Added to cart' : 'Add to cart'}</span><span class="add-plus">{addedMedicine[med.id] ? '✓' : '+'}</span></button></div>
				</div>
			{/each}
		</div>
	</section>
	{/if}

	<section class="content-section quick-help-section" aria-labelledby="quick-help-title">
		<div class="section-heading"><div><span class="section-kicker">WE’RE HERE TO HELP</span><h2 id="quick-help-title">Quick Order &amp; Help</h2></div></div>
		<a href="/prescriptions/upload" class="quick-help-card"><span class="quick-help-icon"><Upload size={22} /></span><span class="quick-help-copy"><strong>Upload for Order</strong><small>Get a call back</small></span><ArrowRight size={21} class="quick-help-arrow" /></a>
	</section>

	<section class="content-section categories-section">
		<div class="section-heading"><div><span class="section-kicker">FIND WHAT YOU NEED</span><h2>Shop by category</h2><p>Everyday essentials, all in one place.</p></div><a class="see-all" href="/shop">All categories <ArrowRight size={16} /></a></div>
		<div class="category-grid">
			{#each categoryCards as category}
				<a href={`/shop?category=${category.slug}`} class="category-card"><span class="category-photo photo-{category.photo}" role="img" aria-label={category.label}></span><span class="category-label">{category.label}</span><span class="category-sub">{category.sub}</span></a>
			{/each}
		</div>
	</section>

	<section class="trust-footer"><div><ShieldCheck size={17} /><span>Your information is handled with care</span></div><span class="trust-divider"></span><div><PackageCheck size={17} /><span>Quality products from trusted suppliers</span></div><span class="trust-divider"></span><div><Microscope size={17} /><span>Prescription medicines require a valid prescription</span></div></section>
</main>

<a class="quick-order" href="/prescriptions/upload"><span class="quick-order-icon"><Upload size={19} /></span><span>Quick order</span></a>

<style>
	.storefront{--ink:#20332f;--muted:#73817d;--green:#087e67;--green-dark:#066652;--line:#e9efeb;--canvas:#f6f8f6;background:#fff;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;padding-bottom:22px}.welcome-strip{height:38px;background:#f1f7f3;border-bottom:1px solid #e7efe9}.welcome-inner{height:100%;max-width:1180px;margin:auto;display:flex;align-items:center;gap:9px;padding:0 24px;font-size:11px;color:#53675f}.open-dot,.promo-eyebrow span{width:7px;height:7px;border-radius:50%;background:#35aa77;display:inline-block}.welcome-inner>a{margin-left:auto;text-decoration:none;color:#17745e;display:flex;align-items:center;gap:5px;font-weight:650}.strip-separator{color:#a2b3aa}.search-wrap{max-width:1180px;margin:auto;padding:20px 24px 13px}.search-box{height:54px;border:1px solid #dce6e0;border-radius:13px;display:flex;align-items:center;gap:12px;padding:5px 6px 5px 16px;box-shadow:0 4px 15px #143d260a;background:white}.search-pill{color:#719186;flex:none}.search-box input{border:0;outline:0;min-width:0;flex:1;font-size:14px;color:var(--ink);background:transparent}.search-box input::placeholder{color:#98a49f}.search-box button{height:40px;border:0;border-radius:9px;background:var(--green);color:white;padding:0 17px;display:flex;align-items:center;gap:8px;font-weight:650;font-size:12px;cursor:pointer}.search-box button:hover,.upload-button:hover{background:var(--green-dark)}.search-hint{margin:9px 0 0 3px;color:#7e8e86;font-size:10px;display:flex;align-items:center;gap:6px}.search-hint svg{color:#329673}.promo-section{max-width:1180px;padding:12px 24px 0;margin:0 auto}.promo-card{min-height:300px;border-radius:20px;position:relative;overflow:hidden;background:#e8f4ec;display:flex;align-items:center}.promo-card:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#f0f8f1 0%,#eff7f0ed 37%,#eff7f09c 57%,transparent 79%);pointer-events:none}.promo-card.rose{background:linear-gradient(115deg,#fff1ed,#f8d4ca 55%,#e99782)}.promo-card.rose:after{background:radial-gradient(ellipse at 78% 52%,#edaa98 0,transparent 42%),linear-gradient(90deg,#fff1ed 0%,#fff1edee 40%,#fff1ed88 67%,transparent)}.promo-card.blue{background:linear-gradient(115deg,#eaf4fc,#cee5f2 55%,#93c2db)}.promo-card.blue:after{background:radial-gradient(ellipse at 78% 52%,#a6cfe0 0,transparent 42%),linear-gradient(90deg,#eaf4fc 0%,#eaf4fcee 40%,#eaf4fc88 67%,transparent)}.promo-photo{position:absolute;right:0;top:0;width:76%;height:100%;object-fit:cover;object-position:center 43%}.promo-copy{position:relative;z-index:1;max-width:480px;padding:38px 0 55px 52px}.promo-eyebrow{font-size:9px;letter-spacing:.15em;font-weight:750;color:#578271;display:flex;align-items:center;gap:8px}.promo-copy h1{white-space:pre-line;font-size:clamp(30px,4vw,46px);line-height:1.09;letter-spacing:-.045em;margin:16px 0 11px;font-weight:720;color:#1e3930}.promo-copy p{color:#61746a;max-width:340px;font-size:13px;line-height:1.65;margin:0 0 19px}.promo-cta{display:inline-flex;align-items:center;gap:10px;text-decoration:none;background:#0b765f;color:white;border-radius:9px;padding:11px 16px;font-weight:650;font-size:12px}.slide-controls{position:absolute;z-index:2;left:51px;bottom:19px;display:flex;align-items:center;gap:11px}.slide-arrow{width:27px;height:27px;border-radius:50%;border:1px solid #b8ccc0;background:#ffffffb8;color:#45645a;display:grid;place-items:center;cursor:pointer}.slide-dots{display:flex;align-items:center;gap:6px}.slide-dots button{width:7px;height:7px;border:0;border-radius:10px;padding:0;background:#b7c9bd;cursor:pointer;transition:all .2s}.slide-dots button.active{width:20px;background:#168167}.promise-row{max-width:1132px;margin:18px auto 0;padding:0 24px;display:grid;grid-template-columns:repeat(3,1fr);background:white}.promise{display:flex;align-items:center;gap:11px;padding:11px 16px;border-right:1px solid var(--line)}.promise:last-child{border:0}.promise-icon{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;flex:none}.promise-icon.green{background:#e8f6ef;color:#25865d}.promise-icon.orange{background:#fff2e6;color:#dd8843}.promise-icon.blue{background:#eaf3fa;color:#5684ac}.promise strong,.promise small{display:block}.promise strong{font-size:11px;font-weight:680}.promise small{font-size:10px;color:#87948e;margin-top:3px}.upload-card{max-width:1132px;margin:14px auto 0;padding:19px 22px;border:1px solid #e8efea;border-radius:15px;background:linear-gradient(110deg,#f8fbf8,#f5faf7);display:flex;align-items:center;gap:15px}.upload-icon{width:45px;height:45px;border-radius:13px;background:#e2f2e9;color:#24845f;display:grid;place-items:center;flex:none}.upload-copy{flex:1}.upload-copy>span,.section-kicker{color:#64907b;font-size:9px;letter-spacing:.13em;font-weight:750}.upload-copy h2{font-size:16px;margin:4px 0 3px;letter-spacing:-.02em}.upload-copy p{font-size:11px;color:#7d8c84;margin:0}.upload-button{display:flex;align-items:center;gap:8px;text-decoration:none;background:var(--green);color:white;border-radius:9px;padding:11px 15px;font-size:11px;font-weight:650;white-space:nowrap}.content-section{max-width:1132px;margin:0 auto;padding:40px 24px 0}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:17px}.section-heading h2{font-size:22px;letter-spacing:-.035em;margin:5px 0 4px;font-weight:700}.section-heading p{margin:0;font-size:11px;color:#829088}.see-all{color:#16745e;text-decoration:none;font-size:11px;display:flex;align-items:center;gap:7px;font-weight:650;padding-bottom:4px}.category-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}.category-card{--cat:#eaf6ef;--accent:#288661;position:relative;min-height:121px;border-radius:14px;padding:14px 12px;text-decoration:none;color:var(--ink);background:var(--cat);border:1px solid color-mix(in srgb,var(--accent) 7%,white);transition:transform .18s,box-shadow .18s;overflow:hidden}.category-card:hover{transform:translateY(-3px);box-shadow:0 8px 20px #19392710}.category-card.mint{--cat:#edf7f0;--accent:#318762}.category-card.peach{--cat:#fff4e8;--accent:#dd9651}.category-card.pink{--cat:#fff0f1;--accent:#d4768c}.category-card.yellow{--cat:#fff8e6;--accent:#c59c40}.category-card.blue{--cat:#edf5fb;--accent:#5d8cb4}.category-card.lavender{--cat:#f3f0fa;--accent:#8872b3}.category-icon{height:39px;width:39px;border-radius:12px;background:#ffffffa8;color:var(--accent);display:grid;place-items:center;margin-bottom:12px}.category-label,.category-sub{display:block}.category-label{font-size:12px;font-weight:690}.category-sub{font-size:9px;color:#839087;margin-top:4px}.category-arrow{position:absolute;right:12px;top:18px;color:var(--accent);opacity:.65}.medicines-section{padding-top:40px}.medicine-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.medicine-card{border:1px solid #e9efeb;border-radius:13px;overflow:hidden;text-decoration:none;color:inherit;background:#fff;transition:box-shadow .2s,transform .2s;min-width:0}.medicine-card:hover{box-shadow:0 8px 22px #16352212;transform:translateY(-2px)}.medicine-image{height:145px;background:#f5f8f5;position:relative;display:grid;place-items:center;overflow:hidden}.medicine-image img{width:100%;height:100%;object-fit:contain;padding:14px}.medicine-placeholder{display:flex;flex-direction:column;align-items:center;gap:9px;color:#9aaba1;font-size:9px}.pill-shape{width:53px;height:53px;border-radius:18px;background:white;color:#70a58a;box-shadow:0 3px 16px #1635220b;display:grid;place-items:center}.rx-tag{position:absolute;left:9px;top:9px;background:#fff4e6;color:#a87635;border-radius:5px;padding:4px 6px;font-size:8px;font-weight:650}.medicine-info{padding:11px 12px 12px}.medicine-form{font-size:9px;color:#87968d}.medicine-info h3{height:34px;overflow:hidden;font-size:12px;line-height:1.4;margin:5px 0 8px;font-weight:650}.price-row{display:flex;align-items:baseline;gap:7px}.price-row strong{font-size:14px;color:#176a50}.price-row del{font-size:10px;color:#a5ada8}.add-button{margin-top:10px;width:100%;height:31px;border:1px solid #abd4bf;background:#f4faf6;color:#197354;border-radius:7px;font-size:10px;font-weight:650;display:flex;justify-content:space-between;align-items:center;padding:0 9px;cursor:pointer}.add-button:hover{background:#e8f5ed}.add-plus{font-size:19px;font-weight:400;line-height:1}.stock-note{display:block;font-size:10px;color:#be665f;margin-top:11px}.mobile-shop-all{display:none}.care-band{max-width:1084px;margin:38px auto 0;padding:22px 27px;border-radius:16px;background:#f1f7f4;display:flex;align-items:center;gap:23px}.care-illustration{position:relative;width:72px;height:72px;display:grid;place-items:center;flex:none}.care-circle{width:64px;height:64px;border-radius:50%;background:#dcefe4;color:#398663;display:grid;place-items:center}.care-sparkle{position:absolute;top:0;right:1px;width:25px;height:25px;border-radius:50%;background:#fff1e9;color:#e09168;display:grid;place-items:center}.care-copy{flex:1}.care-copy h2{font-size:18px;letter-spacing:-.025em;margin:5px 0}.care-copy p{font-size:11px;color:#75857c;margin:0}.care-link{display:flex;align-items:center;gap:8px;padding:10px 13px;border:1px solid #cbded2;border-radius:8px;color:#217456;text-decoration:none;font-size:10px;font-weight:650;white-space:nowrap}.trust-footer{max-width:1084px;margin:21px auto 0;padding:0 15px;display:flex;align-items:center;justify-content:center;gap:17px;color:#85928b}.trust-footer div{display:flex;align-items:center;gap:7px;font-size:9px}.trust-footer svg{color:#549477}.trust-divider{height:14px;width:1px;background:#e5ebe7}
	@media(max-width:760px){.storefront{padding-bottom:82px}.welcome-strip{height:33px}.welcome-inner{padding:0 17px;font-size:10px}.welcome-inner>a{font-size:0;gap:0}.welcome-inner>a svg{width:16px;height:16px}.search-wrap{padding:12px 16px 8px}.search-box{height:48px;border-radius:11px;padding-left:12px;gap:8px}.search-box input{font-size:12px}.search-box button{height:36px;padding:0 12px}.search-box button span{display:none}.search-hint{font-size:9px;margin-top:7px}.promo-section{padding:8px 16px 0}.promo-card{min-height:277px;border-radius:15px;align-items:flex-start}.promo-card:after{background:linear-gradient(90deg,#f0f8f1 0%,#eff7f0f5 40%,#eff7f0b5 65%,#eff7f055 100%)}.promo-photo{width:100%;object-position:62% center;opacity:.72}.promo-copy{padding:28px 20px 64px;max-width:340px}.promo-eyebrow{font-size:8px}.promo-copy h1{font-size:34px;margin:14px 0 9px}.promo-copy p{font-size:11px;line-height:1.55;max-width:250px;margin-bottom:15px}.promo-cta{font-size:10px;padding:10px 12px}.slide-controls{left:19px;bottom:15px}.slide-arrow{width:25px;height:25px}.promise-row{padding:0 12px;margin-top:11px;grid-template-columns:repeat(3,1fr)}.promise{padding:8px 5px;gap:6px;border-right:0;justify-content:center}.promise-icon{width:31px;height:31px;border-radius:10px}.promise-icon svg{width:16px}.promise strong{font-size:9px;white-space:nowrap}.promise small{font-size:8px;white-space:nowrap}.upload-card{margin:12px 16px 0;padding:13px 12px;gap:10px;border-radius:12px}.upload-icon{width:38px;height:38px;border-radius:11px}.upload-icon svg{width:19px}.upload-copy>span{font-size:7px}.upload-copy h2{font-size:13px;margin:3px 0}.upload-copy p{font-size:9px;line-height:1.4;max-width:210px}.upload-button{font-size:0;padding:10px;border-radius:9px;gap:0}.upload-button svg{width:17px;height:17px}.content-section{padding:29px 16px 0}.section-heading{margin-bottom:13px;align-items:flex-end}.section-kicker{font-size:8px}.section-heading h2{font-size:19px;margin:4px 0 3px}.section-heading p{font-size:9px}.see-all{font-size:9px;gap:3px;white-space:nowrap}.see-all svg{width:13px}.category-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.category-card{min-height:100px;border-radius:12px;padding:10px 9px}.category-icon{width:33px;height:33px;margin-bottom:9px}.category-icon svg{width:20px}.category-label{font-size:10px}.category-sub{font-size:8px;margin-top:3px}.category-arrow{top:13px;right:9px}.category-arrow svg{width:12px}.medicines-section{padding-top:29px}.medicine-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.medicine-image{height:128px}.medicine-info{padding:9px}.medicine-info h3{font-size:11px;height:31px}.medicine-form{font-size:8px}.price-row strong{font-size:13px}.add-button{height:29px;font-size:9px}.care-band{margin:27px 16px 0;padding:16px 14px;gap:12px;border-radius:13px}.care-illustration{width:48px;height:48px}.care-circle{width:44px;height:44px}.care-circle svg{width:28px}.care-sparkle{width:20px;height:20px}.care-sparkle svg{width:12px}.care-copy h2{font-size:13px;line-height:1.3}.care-copy p{font-size:9px;line-height:1.45}.care-link{font-size:0;padding:9px;gap:0}.care-link svg{width:16px}.trust-footer{margin:16px 17px 0;gap:8px;flex-wrap:wrap}.trust-footer div{font-size:8px}.trust-footer div:nth-of-type(2),.trust-divider:nth-of-type(2){display:none}.trust-footer svg{width:14px}}
	@media(max-width:390px){.welcome-inner{font-size:9px;gap:6px}.promo-card{min-height:255px}.promo-copy{padding-left:16px}.promo-copy h1{font-size:30px}.promise{flex-direction:column;text-align:center;gap:4px}.promise small{font-size:7px}.upload-card{gap:8px}.upload-copy p{max-width:160px}.category-label{font-size:9px}.medicine-image{height:112px}}
	@media(prefers-reduced-motion:reduce){.category-card,.medicine-card,.slide-dots button{transition:none}}
	.category-card{padding:0;min-height:0;background:#fff;border:1px solid #e9eeeb;border-radius:14px;display:block}.category-photo{display:block;width:100%;aspect-ratio:1.5;background-image:url('/category-photos.png');background-size:300% 200%;background-repeat:no-repeat}.category-photo.photo-0{background-position:0% 0%}.category-photo.photo-1{background-position:50% 0%}.category-photo.photo-2{background-position:100% 0%}.category-photo.photo-3{background-position:0% 100%}.category-photo.photo-4{background-position:50% 100%}.category-photo.photo-5{background-position:100% 100%}.category-label{padding:9px 10px 0;font-size:12px}.category-sub{padding:0 10px 10px;font-size:9px}.category-arrow,.category-icon{display:none}.upload-break{display:none}.quick-order{display:none}
	@media(max-width:760px){.welcome-strip{display:none}.search-wrap{position:sticky;top:59px;z-index:35;max-width:none;padding:9px 16px 10px;background:#fff;border-bottom:1px solid #e8ece9;box-shadow:0 3px 8px #233e3008}.search-box{height:46px;border:1.5px solid #68746e;border-radius:7px;box-shadow:none;padding-left:12px}.search-pill{display:none}.search-box input{font-size:13px}.search-box button{background:transparent;color:#394a41;padding:0 8px}.search-box button svg{width:19px;height:19px}.search-hint{display:none}.promo-section{padding-top:12px}.promo-card{min-height:205px;border-radius:9px;align-items:flex-start}.promo-card:after{background:linear-gradient(90deg,#eff8f2 0%,#eff8f2ed 37%,#eff8f27a 65%,transparent 100%)}.promo-photo{width:100%;object-position:62% center;opacity:.82}.promo-copy{padding:22px 16px 53px;max-width:255px}.promo-eyebrow{font-size:7px;letter-spacing:.11em}.promo-copy h1{font-size:26px;line-height:1.1;margin:10px 0 7px}.promo-copy p{font-size:9px;line-height:1.4;max-width:180px;margin:0 0 9px}.promo-cta{font-size:9px;padding:8px 10px;border-radius:6px}.slide-controls{left:auto;right:12px;bottom:11px;gap:5px}.slide-arrow{display:none}.slide-dots{gap:5px}.slide-dots button{background:#d1d4d1}.slide-dots button.active{background:#d72336;width:17px}.promise-row{display:none}.upload-card{margin:13px 16px 0;padding:14px 14px;border:0;border-radius:8px;background:#fff;box-shadow:0 2px 8px #15241c16;gap:10px}.upload-icon{display:none}.upload-copy>span,.upload-copy p{display:none}.upload-copy h2{font-size:16px;line-height:1.2;margin:0;font-weight:650;text-transform:none}.upload-break{display:block}.upload-button{flex:none;min-width:81px;justify-content:center;background:#0a2948;border-radius:24px;padding:11px 14px;font-size:0;gap:0}.upload-button span{font-size:10px;text-transform:uppercase}.upload-button svg{display:none}.content-section{padding-top:25px}.section-heading{margin-bottom:13px}.section-heading .section-kicker,.section-heading p,.section-heading .see-all{display:none}.section-heading h2{font-size:21px;margin:0;font-weight:650;letter-spacing:-.025em}.category-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 10px}.category-card{border:0;border-radius:0;overflow:visible}.category-photo{aspect-ratio:1.02;border-radius:13px}.category-label{padding:8px 1px 0;font-size:11px;font-weight:550}.category-sub{display:none}.medicines-section{padding-top:31px}.care-band{margin-top:24px}.quick-order{position:fixed;z-index:42;right:14px;bottom:78px;display:flex;align-items:center;gap:10px;border-radius:28px;background:#30363b;color:#fff;padding:11px 17px 11px 12px;text-decoration:none;font-size:12px;font-weight:550;box-shadow:0 6px 18px #101a2427}.quick-order-icon{width:31px;height:31px;border-radius:50%;background:white;color:#30363b;display:grid;place-items:center}}
	@media(max-width:390px){.promo-card{min-height:193px}.promo-copy{padding-left:13px}.promo-copy h1{font-size:24px}.promo-copy p{font-size:8px;max-width:165px}.category-grid{gap:10px 8px}.category-photo{border-radius:11px}.category-label{font-size:10px}.upload-copy h2{font-size:14px}.upload-card{padding:13px 12px}.upload-button{min-width:72px;padding:10px 11px}}
	.medicine-card{display:flex;flex-direction:column}.medicine-card-link{display:block;color:inherit;text-decoration:none}.medicine-title{padding:0 12px}.medicine-info{margin-top:auto}
	@media(max-width:760px){.medicine-title{padding:0 9px}}
	.shelf-grid{display:flex;gap:16px;overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:x mandatory;padding:0 2px 9px;scrollbar-width:thin}
	.shelf-grid .medicine-card{flex:0 0 calc((100% - 64px)/5);min-width:190px;max-width:240px;scroll-snap-align:start;border:1px solid #e5e8e6;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 3px 10px #17251c0a}
	.shelf-grid .medicine-image{height:190px;background:#fff}
	.shelf-grid .medicine-image img{object-fit:contain;padding:8px}
	.shelf-grid .medicine-title{padding:6px 11px 9px}
	.shelf-grid .medicine-title h3{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:38px;font-size:14px;line-height:1.35}
	.shelf-grid .medicine-info{padding:0 11px 11px}
	.offer-badge{position:absolute;left:9px;top:9px;padding:4px 7px;border-radius:6px;background:#fff2df;color:#a25000;font-size:10px;font-weight:700}
	.quick-help-section{padding-top:30px}
	.quick-help-card{min-height:76px;display:flex;align-items:center;gap:14px;padding:12px 15px;border-radius:16px;background:linear-gradient(105deg,#eafff5 0%,#f5f5fa 52%,#ffe1e7 100%);box-shadow:0 3px 10px #24392c12;color:#1f2f2b;text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}
	.quick-help-card:hover{transform:translateY(-1px);box-shadow:0 6px 15px #24392c18}
	.quick-help-icon{width:42px;height:42px;display:grid;place-items:center;flex:none;border-radius:11px;background:#06bf75;color:white}
	.quick-help-copy{display:grid;gap:3px;flex:1}
	.quick-help-copy strong{font-size:15px;font-weight:650}
	.quick-help-copy small{font-size:12px;color:#78837e}
	.quick-help-arrow{color:#24342e;flex:none}
	@media(max-width:760px){.shelf-grid{gap:12px;margin-right:-16px;padding-right:16px}.shelf-grid .medicine-card{flex-basis:42vw;min-width:165px;max-width:220px}.shelf-grid .medicine-image{height:155px}.shelf-grid .medicine-title h3{font-size:12px;min-height:33px}.shelf-grid .medicine-info{padding:0 9px 9px}.shelf-grid .medicine-title{padding:5px 9px 8px}.quick-help-section{padding-top:26px}.quick-help-section .section-heading{margin-bottom:12px}.quick-help-section .section-heading h2{font-size:19px}.quick-help-card{min-height:70px;padding:10px 12px;border-radius:14px}.quick-help-icon{width:38px;height:38px}.quick-help-copy strong{font-size:13px}.quick-help-copy small{font-size:11px}}
</style>
