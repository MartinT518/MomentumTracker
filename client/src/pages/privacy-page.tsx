import { Layout } from "@/components/common/layout";

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-neutral max-w-none">
          <p>Last Updated: May 19, 2025</p>
          
          <h2>1. Introduction</h2>
          <p>At MomentumRun, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.</p>
          
          <h2>2. Information We Collect</h2>
          <p><strong>Personal Information:</strong> We may collect personally identifiable information, such as your name, email address, and demographic information. This information is collected when you register for an account, subscribe to our services, or participate in other platform activities.</p>
          <p><strong>Health and Fitness Data:</strong> With your consent, we collect health and fitness data including but not limited to workout data, heart rate, sleep data, and other biometric information from connected fitness devices and platforms.</p>
          <p><strong>Usage Data:</strong> We may also collect information about how you access and use our platform, including your browser type, IP address, device information, and pages you visit.</p>
          
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Generate personalized training plans and health recommendations</li>
            <li>Process your subscription payments</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Send you platform updates, marketing communications, and other information</li>
            <li>Monitor platform usage and analyze trends</li>
            <li>Protect the platform and our users from fraudulent or illegal activity</li>
          </ul>
          
          <h2>4. Sharing Your Information</h2>
          <p>We may share your information in the following situations:</p>
          <p><strong>With Your Consent:</strong> We may share your information with third parties when you authorize us to do so, such as when you connect your account to external fitness platforms.</p>
          <p><strong>Service Providers:</strong> We may share your information with service providers who perform services on our behalf, such as payment processing and data analysis.</p>
          <p><strong>Coaches:</strong> If you use our coaching services, your health and fitness data may be shared with your selected coach to provide personalized guidance.</p>
          <p><strong>Legal Requirements:</strong> We may disclose your information where required to do so by law or in response to valid requests by public authorities.</p>
          
          <h2>5. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect the information we collect and store. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
          
          <h2>6. Third-Party Integrations</h2>
          <p>Our platform allows you to connect with third-party services such as Strava, Garmin, Polar, and others. When you connect these services, we may collect information from these platforms in accordance with the authorizations you provide. Please note that we are not responsible for the privacy practices of these third-party services.</p>
          
          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul>
            <li>The right to access the personal information we have about you</li>
            <li>The right to request corrections to your personal information</li>
            <li>The right to request that we delete your personal information</li>
            <li>The right to withdraw consent for processing your data</li>
            <li>The right to data portability</li>
          </ul>
          
          <h2>8. Children's Privacy</h2>
          <p>Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.</p>
          
          <h2>9. Changes to This Privacy Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
          
          <h2>10. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@momentumrun.com.</p>
        </div>
      </div>
    </Layout>
  );
}