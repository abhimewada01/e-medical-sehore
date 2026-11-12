<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Activity, Bell, ChevronDown, CircleUserRound, Menu, Microscope, Pill, ShoppingCart, Stethoscope, User, X } from 'lucide-svelte';

	let { user }: { user: App.Locals['user'] } = $props();
	let mobileMenuOpen = $state(false);
	let cartCount = $state(0);
	const navLinks = [
		{ href: '/shop', label: 'Medicines' },
		{ href: '/shop?category=vitamins', label: 'Vitamins & wellness' },
		{ href: '/shop?category=skincare', label: 'Personal care' },
		{ href: '/prescriptions/upload', label: 'Upload prescription' }
	];

	onMount(() => {
		const updateCount = () => {
			try { cartCount = Object.values(JSON.parse(localStorage.getItem('emedCart') || '{}')).reduce((sum: number, item: any) => sum + (item.qty || 0), 0); } catch { cartCount = 0; }
		};
		updateCount();
		window.addEventListener('cart-updated', updateCount);
		return () => window.removeEventListener('cart-updated', updateCount);
	});
</script>

<header class="site-header">
	<div class="header-inner">
		<a href="/" class="brand" aria-label="E-Medical Sehore home">
			<span class="brand-mark"><span class="brand-cross">+</span></span>
			<span class="brand-type"><strong>E-Medical</strong><small>SEHORE PHARMACY</small></span>
		</a>
		<a href="/shop" class="delivery-location"><span class="location-pin"><Activity size={16} /></span><span><small>DELIVERING TO</small><strong>Sehore, Madhya Pradesh</strong></span><ChevronDown size={15} /></a>
		<div class="desktop-links">{#each navLinks as link}<a href={link.href} class:current={$page.url.pathname === link.href}>{link.label}</a>{/each}</div>
		<div class="header-actions">
			{#if user}<a href="/{user.role.toLowerCase()}/dashboard" class="icon-action" aria-label="Notifications"><Bell size={19} /></a>{/if}
			<a href="/cart" class="icon-action cart-action" aria-label="Shopping cart"><ShoppingCart size={20} />{#if cartCount > 0}<span class="cart-count">{cartCount > 99 ? '99+' : cartCount}</span>{/if}</a>
			{#if user}<a href="/{user.role.toLowerCase()}/dashboard" class="account-link"><User size={16} /><span>{user.fullName.split(' ')[0]}</span></a>{:else}<a href="/auth/login" class="login-link">Sign in</a><a href="/auth/register" class="account-link signup-link"><span>Create account</span></a>{/if}
			<button class="menu-toggle" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} onclick={() => mobileMenuOpen = !mobileMenuOpen}>{#if mobileMenuOpen}<X size={21} />{:else}<Menu size={21} />{/if}</button>
		</div>
	</div>
	{#if mobileMenuOpen}<nav class="mobile-menu">{#each navLinks as link}<a href={link.href} onclick={() => mobileMenuOpen = false}>{link.label}<span>›</span></a>{/each}<a href="/cart" onclick={() => mobileMenuOpen = false}>Your cart<span>›</span></a></nav>{/if}
</header>

<nav class="mobile-bottom-nav" aria-label="Primary navigation">
	<button type="button" onclick={() => mobileMenuOpen = !mobileMenuOpen}><Menu size={20} strokeWidth={1.8} /><span>Menu</span></button>
	<a href="/shop" class:active={$page.url.pathname.startsWith('/shop')}><Pill size={20} strokeWidth={1.8} /><span>Pharmacy</span></a>
	<a href="/about/doctors" class:active={$page.url.pathname.startsWith('/about/doctors')}><Stethoscope size={20} strokeWidth={1.8} /><span>Doctors</span></a>
	<a href="/shop?category=devices" class:active={$page.url.searchParams.get('category') === 'devices'}><Microscope size={20} strokeWidth={1.8} /><span>Diagnostics</span></a>
	<a href={user ? `/${user.role.toLowerCase()}/dashboard` : '/auth/login'} class:active={$page.url.pathname.includes('dashboard') || $page.url.pathname.includes('login')}><CircleUserRound size={20} strokeWidth={1.8} /><span>Account</span></a>
</nav>

<style>
	.site-header{position:sticky;top:0;z-index:40;background:#fff;border-bottom:1px solid #ebefec}.header-inner{height:69px;max-width:1230px;margin:auto;padding:0 25px;display:flex;align-items:center;gap:28px}.brand{display:flex;align-items:center;gap:9px;text-decoration:none;color:#263831;flex:none}.brand-mark{width:35px;height:35px;border-radius:11px;background:#087b64;display:grid;place-items:center;box-shadow:0 4px 10px #087b6420}.brand-cross{font-size:30px;line-height:1;color:white;font-weight:450;margin-top:-3px}.brand-type strong,.brand-type small{display:block}.brand-type strong{font-size:14px;letter-spacing:-.03em}.brand-type small{font-size:7px;letter-spacing:.13em;color:#819088;margin-top:2px}.delivery-location{display:flex;align-items:center;gap:8px;text-decoration:none;color:#293b33;flex:none}.location-pin{width:30px;height:30px;border-radius:9px;background:#edf6ef;display:grid;place-items:center;color:#308462}.delivery-location small,.delivery-location strong{display:block}.delivery-location small{font-size:7px;letter-spacing:.12em;color:#93a098}.delivery-location strong{font-size:10px;font-weight:650;margin-top:2px}.delivery-location>svg{color:#97a39c}.desktop-links{display:flex;align-items:center;justify-content:center;gap:22px;flex:1}.desktop-links a{font-size:10px;color:#62716a;text-decoration:none;white-space:nowrap}.desktop-links a:hover,.desktop-links a.current{color:#087b64}.header-actions{display:flex;align-items:center;gap:14px;flex:none}.icon-action{width:34px;height:34px;color:#4b6056;display:grid;place-items:center;text-decoration:none;position:relative}.cart-count{position:absolute;right:-2px;top:-1px;min-width:16px;height:16px;padding:0 4px;border-radius:10px;background:#dd4f4f;color:white;font-size:9px;font-weight:700;display:grid;place-items:center;border:1.5px solid white}.login-link{font-size:10px;text-decoration:none;color:#576b61;white-space:nowrap}.account-link{height:34px;padding:0 11px;border-radius:8px;background:#edf6f0;color:#176a50;text-decoration:none;display:flex;align-items:center;gap:6px;font-size:10px;font-weight:650;white-space:nowrap}.signup-link{background:#087b64;color:white}.menu-toggle{display:none;border:0;background:none;color:#3b5147;padding:6px}.mobile-menu{display:none}.mobile-bottom-nav{display:none}
	@media(max-width:980px){.header-inner{gap:16px;padding:0 18px}.desktop-links{gap:14px}.desktop-links a{font-size:9px}.header-actions{gap:8px}}
	@media(max-width:760px){.header-inner{height:59px;padding:0 16px;gap:11px}.brand{display:none}.delivery-location{gap:6px;margin-left:0}.location-pin{width:27px;height:27px}.delivery-location small{font-size:6px}.delivery-location strong{font-size:9px}.delivery-location>svg{width:13px}.desktop-links,.header-actions>.login-link,.header-actions>.account-link,.header-actions>.icon-action:first-child{display:none}.header-actions{gap:4px;margin-left:auto}.header-actions>.cart-action{display:grid;width:32px}.menu-toggle{display:block}.mobile-menu{display:block;padding:5px 17px 12px;border-top:1px solid #eff2ef;background:#fff}.mobile-menu a{display:flex;justify-content:space-between;padding:11px 3px;color:#43574c;text-decoration:none;border-bottom:1px solid #f1f3f1;font-size:12px}.mobile-menu a:last-child{border:0}.mobile-menu a span{font-size:19px;color:#9bac9f;line-height:14px}.mobile-bottom-nav{position:fixed;z-index:45;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(5,1fr);padding:8px 7px calc(8px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #e7ece8;box-shadow:0 -4px 15px #193b2608}.mobile-bottom-nav a,.mobile-bottom-nav button{border:0;background:transparent;display:flex;align-items:center;justify-content:center;gap:4px;flex-direction:column;text-decoration:none;color:#727e79;font-size:8px;font-family:inherit;font-weight:550;min-height:42px;padding:0}.mobile-bottom-nav a.active{color:#087b64}.mobile-bottom-nav a.active svg{stroke-width:2.3}}
</style>
