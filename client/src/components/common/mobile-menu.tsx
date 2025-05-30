import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { cn } from "@/lib/utils";
import AetherRunLogo from "@/assets/aether-run-logo.png";
import {
  BarChart3,
  ListTodo,
  Activity,
  Zap,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Dumbbell,
  Heart,
  Apple,
  Search,
  CreditCard,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { SearchButton } from "@/components/common/search-dialog-fixed";

export function MobileMenu() {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Check if user is an admin (in a real app, this would check a proper admin role)
  const isAdmin = user?.id === 1;
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  const toggleMenu = () => {
    console.log("Toggle menu clicked, current state:", isOpen);
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };
  
  const adminItems = [
    {
      title: "Coach Management",
      href: "/admin/coaches",
      icon: UserCog,
      active: location === "/admin/coaches",
    },
  ];

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      active: location === "/dashboard",
    },
    {
      title: "Training Plan",
      href: "/training-plan",
      icon: ListTodo,
      active: location === "/training-plan",
    },
    {
      title: "Activities",
      href: "/activities",
      icon: Activity,
      active: location === "/activities",
    },
    {
      title: "Strength Exercises",
      href: "/strength-exercises",
      icon: Dumbbell,
      active: location === "/strength-exercises",
    },
    {
      title: "Health Metrics",
      href: "/health-metrics",
      icon: Heart,
      active: location === "/health-metrics",
    },
    {
      title: "Nutrition",
      href: "/nutrition",
      icon: Apple,
      active: location === "/nutrition",
    },
    {
      title: "Goals",
      href: "/goals",
      icon: Zap,
      active: location === "/goals",
    },
    {
      title: "Profile",
      href: "/profile",
      icon: User,
      active: location === "/profile",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      active: location === "/settings",
    },
    {
      title: "Subscription",
      href: "/subscription",
      icon: CreditCard,
      active: location === "/subscription" || location.startsWith("/subscription/"),
    },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-b border-white/20 z-50">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center">
            <img 
              src={AetherRunLogo} 
              alt="AetherRun" 
              className="h-10 w-auto object-contain" 
            />
          </div>
          <button 
            className="p-2 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 text-white drop-shadow-md" />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-gray-600 bg-opacity-75 z-20 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMenu}
      />

      {/* Mobile Menu Panel */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-30 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Fixed Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold font-heading text-neutral-darker">
            <span className="text-primary mr-2">Aether</span>Run
          </h1>
          <button 
            className="p-1 rounded-md hover:bg-neutral-lighter"
            onClick={closeMenu}
          >
            <X className="h-6 w-6 text-neutral-darker" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 py-3 border-b border-gray-200">
          <SearchButton />
        </div>

        {/* Scrollable Navigation Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <nav className="overflow-y-auto flex-1 pb-4">
            <ul className="mt-2">
              {navItems.map((item) => (
                <li key={item.title}>
                  <Link 
                    href={item.href}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center px-4 py-3 text-neutral-dark hover:bg-neutral-lighter",
                      item.active && "bg-primary-light/30 border-r-4 border-primary font-medium text-neutral-darker"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 mr-3 text-neutral-medium",
                      item.active && "text-primary"
                    )} />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="px-4 pt-6 pb-2">
                  <p className="text-xs font-medium text-neutral-medium tracking-wider uppercase">Admin</p>
                </div>
                <ul>
                  {adminItems.map((item) => (
                    <li key={item.title}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center px-4 py-3 text-neutral-dark hover:bg-neutral-lighter",
                          item.active && "bg-primary-light/30 border-r-4 border-primary font-medium text-neutral-darker"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 mr-3 text-neutral-medium",
                          item.active && "text-primary"
                        )} />
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </nav>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex items-center text-neutral-dark hover:text-primary"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
