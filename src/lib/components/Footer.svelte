<script lang="ts">
	import { Pill, Phone, Mail, MapPin } from 'lucide-svelte';
</script>

<footer class="bg-gray-900 text-gray-300 pt-12 pb-6">
	<div class="max-w-7xl mx-auto px-4">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
			<!-- Brand -->
			<div class="col-span-1 md:col-span-1">
				<div class="flex items-center gap-2 mb-4">
					<div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
						<Pill size={18} class="text-white" />
					</div>
					<div>
						<span class="font-bold text-white text-sm leading-none">E-Medical Sehore</span>
					</div>
				</div>
				<p class="text-sm text-gray-400 leading-relaxed mb-4">
					Your trusted digital pharmacy in Sehore, MP. Genuine medicines, fast delivery, expert pharmacists.
				</p>
				<div class="space-y-2 text-sm">
					<div class="flex items-center gap-2">
						<Phone size={14} class="text-purple-400" />
						<span>+91 9876543210</span>
					</div>
					<div class="flex items-center gap-2">
						<Mail size={14} class="text-purple-400" />
						<span>support@emedical.sehore</span>
					</div>
					<div class="flex items-center gap-2">
						<MapPin size={14} class="text-purple-400" />
						<span>Sehore, Madhya Pradesh 466001</span>
					</div>
				</div>
			</div>

			<!-- Quick Links -->
			<div>
				<h4 class="text-white font-semibold mb-4">Quick Links</h4>
				<ul class="space-y-2 text-sm">
					{#each [['/', 'Home'], ['/shop', 'Medicines'], ['/prescriptions/upload', 'Upload Prescription'], ['/cart', 'Cart'], ['/auth/login', 'Login']] as [href, label]}
						<li><a href={href} class="hover:text-purple-400 transition-colors">{label}</a></li>
					{/each}
				</ul>
			</div>

			<!-- Categories -->
			<div>
				<h4 class="text-white font-semibold mb-4">Categories</h4>
				<ul class="space-y-2 text-sm">
					{#each [['tablets', 'Tablets & Capsules'], ['syrups', 'Syrups & Liquids'], ['vitamins', 'Vitamins & Supplements'], ['skincare', 'Skincare'], ['devices', 'Medical Devices']] as [slug, label]}
						<li><a href="/shop?category={slug}" class="hover:text-purple-400 transition-colors">{label}</a></li>
					{/each}
				</ul>
			</div>

			<!-- Legal -->
			<div>
				<h4 class="text-white font-semibold mb-4">Legal</h4>
				<ul class="space-y-2 text-sm">
					{#each [['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Service'], ['/refund', 'Refund Policy'], ['/about', 'About Us']] as [href, label]}
						<li><a href={href} class="hover:text-purple-400 transition-colors">{label}</a></li>
					{/each}
				</ul>
				<div class="mt-6">
					<div class="text-xs text-gray-500 bg-gray-800 rounded-lg p-3">
						<div class="font-semibold text-gray-400 mb-1">License</div>
						<div>Drug License No: MP/SEHORE/2024/001</div>
					</div>
				</div>
			</div>
		</div>

		<div class="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
			<div>© {new Date().getFullYear()} E-Medical Sehore. All rights reserved.</div>
			<div class="flex items-center gap-4">
				<span class="flex items-center gap-1">🔒 Secured by Razorpay</span>
				<span>|</span>
				<span>Licensed Pharmacy</span>
			</div>
		</div>
	</div>
</footer>
