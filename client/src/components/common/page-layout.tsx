import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileMenu } from "./mobile-menu";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 flex flex-col">
      <MobileMenu />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 pt-16 md:pt-0 md:ml-64 min-h-screen">
          <div className={`pl-4 pr-4 md:pl-6 md:pr-6 pt-6 pb-6 max-w-7xl mx-auto ${className}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}