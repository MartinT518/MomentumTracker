import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { Footer } from "@/components/common/footer";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MobileMenu />
        
        <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 px-4 md:px-6">
          {/* For mobile view padding to account for fixed header */}
          <div className="md:hidden pt-20"></div>
          
          <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
            
            <div className="prose prose-neutral max-w-none">
              <p>Last Updated: May 19, 2025</p>
              
              <h2>1. Introduction</h2>
              <p>Welcome to MomentumRun. These Terms of Service govern your use of our website, applications, and services. By accessing or using our platform, you agree to be bound by these Terms.</p>
              
              <h2>2. Definitions</h2>
              <p>"MomentumRun," "we," "us," and "our" refer to the service provider.</p>
              <p>"User," "you," and "your" refer to individuals using our services.</p>
              <p>"Platform" refers to our website, applications, and services.</p>
              <p>"Content" refers to text, graphics, images, music, software, audio, video, information or other materials.</p>
              
              <h2>3. Eligibility</h2>
              <p>You must be at least 18 years old to use MomentumRun. By agreeing to these Terms, you represent that you are at least 18 years of age. If you are using the service on behalf of a legal entity, you represent that you have the authority to bind that entity to these Terms.</p>
              
              <h2>4. Account Registration</h2>
              <p>To access certain features of the Platform, you will need to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
              
              <h2>5. User Content</h2>
              <p>You are solely responsible for any content that you create, transmit, or display while using MomentumRun.</p>
              <p>By posting content on MomentumRun, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate, and distribute your content in any existing or future media.</p>
              
              <h2>6. Subscriptions and Payments</h2>
              <p>Some features of MomentumRun require a paid subscription. By subscribing to our premium services, you agree to pay all fees in accordance with the pricing and payment terms presented to you at the time of purchase.</p>
              <p>Subscription fees are billed in advance on a monthly or annual basis. Unless otherwise stated, subscriptions automatically renew at the end of each billing period.</p>
              <p>You can cancel your subscription at any time through your account settings. If you cancel, you will continue to have access to the premium features until the end of your current billing period.</p>
              
              <h2>7. Privacy</h2>
              <p>Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and disclose information about you.</p>
              
              <h2>8. Intellectual Property</h2>
              <p>MomentumRun and its content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
              
              <h2>9. Limitation of Liability</h2>
              <p>IN NO EVENT SHALL MOMENTUMRUN, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES; (B) ANY CONTENT OBTAINED FROM THE SERVICES; OR (C) UNAUTHORIZED ACCESS, USE OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.</p>
              
              <h2>10. Health Disclaimer</h2>
              <p>MomentumRun provides fitness and health information and is intended only as an informational resource. The content is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
              
              <h2>11. Termination</h2>
              <p>We may terminate or suspend your account and bar access to the Platform immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
              
              <h2>12. Changes to Terms</h2>
              <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.</p>
              
              <h2>13. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us at support@momentumrun.com.</p>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}