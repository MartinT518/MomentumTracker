import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileMenu } from "./mobile-menu";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MobileMenu />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 pt-16 md:pt-0 md:ml-64 min-h-screen">
          <div className={`p-6 max-w-7xl mx-auto ${className}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}