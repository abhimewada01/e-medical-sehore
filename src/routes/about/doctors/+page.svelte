<svelte:head>
	<title>Doctor Referral Network - E-Medical Sehore</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-12">
	<div class="text-center mb-10">
		<h1 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">Doctor Referral Network</h1>
		<p class="text-gray-500 max-w-xl mx-auto">Connecting qualified medical practitioners with patients in Sehore for authentic medicines and doorstep healthcare support.</p>
	</div>

	<div class="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-8 space-y-6 text-gray-700 leading-relaxed">
		<h2 class="text-xl font-bold text-purple-800">How the Doctor Program Works</h2>
		<p>
			Registered and verified doctors in Sehore receive a specialized QR code and referral link for their clinic. When patients scan this QR code, they are directed to the E-Medical Sehore platform to order genuine medicines prescribed by their doctor.
		</p>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
			<div class="p-5 bg-purple-50 rounded-2xl">
				<div class="text-2xl font-bold text-purple-700 mb-2">1. Register</div>
				<p class="text-sm text-purple-900">Sign up with your medical registration license number, clinic address, and contact details.</p>
			</div>
			<div class="p-5 bg-blue-50 rounded-2xl">
				<div class="text-2xl font-bold text-blue-700 mb-2">2. Get QR Code</div>
				<p class="text-sm text-blue-900">Pharmacy administrators verify the license and issue your clinic a unique digital QR referral display.</p>
			</div>
			<div class="p-5 bg-violet-50 rounded-2xl">
				<div class="text-2xl font-bold text-violet-700 mb-2">3. Track Patients</div>
				<p class="text-sm text-violet-900">View real-time patient visits, order fulfillment statistics, and referral analytics in your doctor dashboard.</p>
			</div>
		</div>

		<div class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
			<strong>Legal & Ethical Compliance:</strong> Under the Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations, 2002 and applicable pharmacy laws, doctors must never receive financial kickbacks for prescriptions. Financial commission functionality remains strictly disabled by default. Referral codes never substitute for a valid doctor's prescription.
		</div>

		<div class="pt-4 flex gap-4">
			<a href="/auth/register" class="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition-colors">
				Join as Doctor
			</a>
			<a href="/shop" class="border border-gray-200 px-6 py-3 rounded-full font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
				Browse Catalog
			</a>
		</div>
	</div>
</div>
