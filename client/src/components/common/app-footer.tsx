import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function AppFooter() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    toast({
      title: "Subscribed!",
      description: "Thank you for subscribing to our newsletter.",
    });
    
    setEmail("");
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="border-t border-white/20 bg-white/10 backdrop-blur-lg shadow-xl">
      <div className="max-w-6xl mx-auto py-10 md:py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Information */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white drop-shadow-lg">CatholicRun</h4>
            <p className="text-sm text-white/80 mb-4 drop-shadow-md">
              An AI-powered training platform for runners and athletes, 
              providing personalized training plans and data-driven insights.
            </p>
            <div className="flex space-x-3">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-all duration-300 hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-all duration-300 hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-all duration-300 hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white drop-shadow-lg">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-white/80 hover:text-white transition-all duration-300 hover:translate-x-1">Home</Link>
              </li>
              <li>
                <Link href="/activities" className="text-sm text-white/80 hover:text-white transition-all duration-300 hover:translate-x-1">Activities</Link>
              </li>
              <li>
                <Link href="/coaches" className="text-sm text-white/80 hover:text-white transition-all duration-300 hover:translate-x-1">Coaches</Link>
              </li>
              <li>
                <Link href="/nutrition" className="text-sm text-white/80 hover:text-white transition-all duration-300 hover:translate-x-1">Nutrition</Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-white/80 hover:text-white transition-all duration-300 hover:translate-x-1">Pricing</Link>
              </li>
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white drop-shadow-lg">Information</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-sm text-white/80 hover:text-white transition-all duration-300 hover:translate-x-1">FAQs</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-white/80 hover:text-white transition-all duration-300 hover:translate-x-1">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-white/80 hover:text-white transition-all duration-300 hover:translate-x-1">Terms of Service</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white drop-shadow-lg">Stay Updated</h4>
            <p className="text-sm text-white/80 mb-4 drop-shadow-md">
              Subscribe to our newsletter for training tips, updates, and exclusive offers.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/20 border border-white/30 rounded-md px-3 py-2 text-sm text-white placeholder-white/70 backdrop-blur-sm focus:bg-white/25 focus:border-white/50 transition-all duration-300"
              />
              <button 
                type="submit"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 bg-gradient-to-r from-[#8a4df0] to-[#3a4db9] hover:from-[#7a3de0] hover:to-[#2a3da9] text-white border-none shadow-lg hover:shadow-xl hover:scale-105 h-9 px-3 py-2"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-white/80 mb-4 md:mb-0 drop-shadow-md">
            © {currentYear} AetherRun. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-xs text-white/70 hover:text-white transition-all duration-300">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-white/70 hover:text-white transition-all duration-300">
              Terms
            </Link>
            <Link href="/faq" className="text-xs text-white/70 hover:text-white transition-all duration-300">
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}