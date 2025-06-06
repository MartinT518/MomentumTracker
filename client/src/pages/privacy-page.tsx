import { AppLayout } from "@/components/common/app-layout";
import { useEffect } from "react";

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-white drop-shadow-sm">Privacy Policy</h1>
        
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8">
          <p className="text-lg text-white/70 mb-6 drop-shadow-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Introduction</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              AetherRun ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our fitness tracking application and related services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Information We Collect</h2>
            <h3 className="text-xl font-medium mb-3 text-white drop-shadow-sm">Personal Information</h3>
            <ul className="list-disc pl-6 mb-4 text-white/80 drop-shadow-sm space-y-1">
              <li>Account information (username, email address)</li>
              <li>Profile information (age, weight, height, fitness goals)</li>
              <li>Payment information (processed securely through Stripe)</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-3 text-white drop-shadow-sm">Health and Fitness Data</h3>
            <ul className="list-disc pl-6 mb-4 text-white/80 drop-shadow-sm space-y-1">
              <li>Activity data from connected fitness platforms</li>
              <li>Heart rate variability and sleep metrics</li>
              <li>Training plans and workout history</li>
              <li>Nutrition logs and dietary preferences</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">How We Use Your Information</h2>
            <ul className="list-disc pl-6 mb-4 text-white/80 drop-shadow-sm space-y-1">
              <li>Provide personalized training plans and recommendations</li>
              <li>Generate AI-powered nutrition advice</li>
              <li>Track your fitness progress and goals</li>
              <li>Improve our services and develop new features</li>
              <li>Communicate with you about your account and our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Data Sharing and Third Parties</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              We integrate with various fitness platforms (Strava, Garmin Connect, Polar, Google Fit, WHOOP, Apple Health, and Fitbit) with your explicit consent. We do not sell your personal data to third parties.
            </p>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              We may share anonymized, aggregated data for research purposes to improve fitness and health outcomes for the broader community.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Data Security</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              We implement industry-standard security measures to protect your information, including encryption in transit and at rest, secure authentication protocols, and regular security audits.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Your Rights</h2>
            <ul className="list-disc pl-6 mb-4 text-white/80 drop-shadow-sm space-y-1">
              <li>Access and download your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Disconnect third-party integrations at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Contact Us</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="mb-2 text-white/80 drop-shadow-sm">Email: privacy@aetherrun.com</p>
            <p className="mb-4 text-white/80 drop-shadow-sm">Address: [Your Company Address]</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white drop-shadow-sm">Changes to This Policy</h2>
            <p className="mb-4 text-white/80 drop-shadow-sm">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through our application.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}