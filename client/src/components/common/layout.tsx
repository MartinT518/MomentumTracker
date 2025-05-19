import { ReactNode } from "react";
import { Footer } from "./footer";
import { Sidebar } from "./sidebar";
import { MobileMenu } from "./mobile-menu";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function Layout({ children, showSidebar = true }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}
        {showSidebar && <MobileMenu />}
        
        <main className={`flex-1 overflow-y-auto bg-neutral-lighter ${showSidebar ? 'pt-0 md:pt-4' : ''} pb-16 md:pb-4 px-4 md:px-6`}>
          {showSidebar && (
            // For mobile view padding to account for fixed header
            <div className="md:hidden pt-20"></div>
          )}
          
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}