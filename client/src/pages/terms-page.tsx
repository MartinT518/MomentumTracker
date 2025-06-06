import { AppLayout } from "@/components/common/app-layout";
import { useEffect } from "react";

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-white drop-shadow-sm">Terms of Service</h1>
        
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8">
          <p className="text-lg text-white/70 mb-6 drop-shadow-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Acceptance of Terms</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              By accessing and using AetherRun, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Description of Service</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              AetherRun is an AI-powered fitness tracking platform that provides personalized training plans, nutrition recommendations, and health analytics. Our service integrates with various fitness platforms and uses artificial intelligence to provide personalized recommendations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">User Accounts</h2>
            <ul className="list-disc pl-6 mb-4 text-white/80 drop-shadow-sm space-y-1">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must be at least 18 years old to use our service</li>
              <li>One person may not maintain more than one account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Health and Safety Disclaimer</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              <strong className="text-white">IMPORTANT:</strong> AetherRun provides fitness and nutrition recommendations for informational purposes only. Our AI-generated advice should not be considered medical advice. Always consult with qualified healthcare professionals before starting any new exercise program or making significant dietary changes.
            </p>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              You acknowledge that:
            </p>
            <ul className="list-disc pl-6 mb-4 text-white/80 drop-shadow-sm space-y-1">
              <li>Physical exercise involves inherent risks</li>
              <li>You participate in fitness activities at your own risk</li>
              <li>You should discontinue any activity if you feel unwell</li>
              <li>Our recommendations are based on general fitness principles and may not be suitable for your specific health conditions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Subscription Services</h2>
            <h3 className="text-xl font-medium mb-3 text-white drop-shadow-sm">Free Tier</h3>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              Basic features including activity tracking, goal setting, and limited training recommendations.
            </p>
            
            <h3 className="text-xl font-medium mb-3 text-white drop-shadow-sm">Premium Subscriptions</h3>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              Monthly and annual premium subscriptions unlock advanced features. Annual subscribers receive additional benefits including coach access and early feature access.
            </p>
            
            <h3 className="text-xl font-medium mb-3 text-white drop-shadow-sm">Billing and Cancellation</h3>
            <ul className="list-disc pl-6 mb-4 text-white/80 drop-shadow-sm space-y-1">
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>You may cancel at any time through your account settings</li>
              <li>Refunds are provided according to our refund policy</li>
              <li>Price changes will be communicated 30 days in advance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">User Conduct</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 text-white/80 drop-shadow-sm space-y-1">
              <li>Use the service for any illegal purposes</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Share your account credentials with others</li>
              <li>Upload malicious code or attempt to disrupt our service</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Third-Party Integrations</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              Our service integrates with third-party fitness platforms. Your use of these integrations is subject to the respective platforms' terms of service. We are not responsible for the availability or functionality of third-party services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Intellectual Property</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              All content, features, and functionality of AetherRun are owned by us and are protected by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Limitation of Liability</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              To the maximum extent permitted by law, AetherRun shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Termination</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              We reserve the right to terminate or suspend your account and access to our service at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Changes to Terms</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              We reserve the right to modify these terms at any time. We will notify users of material changes via email or through our application. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Contact Information</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="mb-2 text-white/80 drop-shadow-sm">Email: legal@aetherrun.com</p>
            <p className="mb-4 text-white/80 drop-shadow-sm">Address: [Your Company Address]</p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}