export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-white py-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-sm text-primary-400 font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 text-white">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: April 14, 2026</p>
        </div>

        <div className="glass rounded-3xl p-8 md:p-12 border-white/10 prose prose-invert max-w-none">
          <p className="text-gray-400 mb-6">
            This Privacy Policy describes how AI Menu Growth Engine ("we," "us," or "our") collects, uses, and shares your personal information when you use our website and services.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4 pb-2 border-b border-white/10">1. Information We Collect</h2>
          <p className="text-gray-400 mb-4">We collect information you provide directly to us, including:</p>
          <ul className="list-disc pl-6 text-gray-400 space-y-2 mb-6">
            <li><strong>Account Information:</strong> Name, email address, restaurant name, and password when you register.</li>
            <li><strong>Content:</strong> Images, menus, and descriptions you upload or generate using our AI services.</li>
            <li><strong>Payment Information:</strong> Processed securely by our payment partners (e.g., Stripe); we do not store full credit card details.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4 pb-2 border-b border-white/10">2. How We Use Your Information</h2>
          <p className="text-gray-400 mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 text-gray-400 space-y-2 mb-6">
            <li>Provide, maintain, and improve our AI image enhancement and copywriting services.</li>
            <li>Process transactions and manage your account credits.</li>
            <li>Send you technical notices, updates, and support messages.</li>
            <li>Train and improve our AI models (only if you explicitly opt-in; otherwise, your images are deleted after processing).</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4 pb-2 border-b border-white/10">3. Data Security and Storage</h2>
          <p className="text-gray-400 mb-6">
            We implement industry-standard security measures to protect your data. Original unenhanced images are automatically deleted from our processing servers within 24 hours unless saved to your active menu gallery.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4 pb-2 border-b border-white/10">4. Third-Party Services</h2>
          <p className="text-gray-400 mb-6">
            We may share information with third-party vendors who provide services on our behalf, such as cloud hosting (AWS/GCP), AI processing APIs, and payment gateways. These partners are bound by strict confidentiality agreements.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4 pb-2 border-b border-white/10">5. Contact Us</h2>
          <p className="text-gray-400 mb-6">
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@aimenu.app" className="text-primary-400 hover:text-primary-300">privacy@aimenu.app</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
