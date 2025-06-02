import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileMenu } from "./mobile-menu";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-800"
         style={{
           background: `
             linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(79, 70, 229, 0.8) 100%),
             radial-gradient(circle at 30% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
             radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)
           `
         }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MobileMenu />
        
        <main className={`flex-1 overflow-y-auto ${className || ''}`}>
          {/* Mobile padding for fixed header */}
          <div className="lg:hidden pt-16"></div>
          
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}