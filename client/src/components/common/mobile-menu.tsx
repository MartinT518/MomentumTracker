import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { cn } from "@/lib/utils";
import catholicRunLogo from "@assets/688bcfbe-f276-4711-8a45-55f25a921b52_20250624_231034_0000_1750795883864.png";
import {
  BarChart3,
  ListTodo,
  Activity,
  Target,
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
  Users,
  Crown,
  HelpCircle,
  DollarSign,
} from "lucide-react";
import { SearchButton } from "@/components/common/search-dialog-fixed";

import sinine_musttaust from "@assets/sinine_musttaust.png";

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
    setIsOpen(prev => {
      console.log("Setting new state:", !prev);
      return !prev;
    });
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
      icon: Target,
      active: location === "/goals",
    },
    {
      title: "Coaches",
      href: "/coaches",
      icon: Users,
      active: location === "/coaches",
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
      active: location === "/subscription",
    },
    {
      title: "FAQ & Support",
      href: "/faq",
      icon: HelpCircle,
      active: location === "/faq",
    },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-b border-white/20 z-50">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center">
            <img 
              src={sinine_musttaust} 
              alt="AetherRun Logo" 
              className="w-full h-32 object-contain max-w-96 mt-[-44px] mb-[-44px] pt-[0px] pb-[0px] pl-[0px] pr-[0px] ml-[0px] mr-[0px]"
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
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-20 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeMenu}
      />
      {/* Mobile Menu Panel */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white/10 backdrop-blur-lg border-r border-white/20 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Fixed Header */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <h1 className="text-xl font-bold font-heading text-white drop-shadow-md">
            <span className="text-blue-300 mr-2">Aether</span>Run
          </h1>
          <button 
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
            onClick={closeMenu}
          >
            <X className="h-6 w-6 text-white drop-shadow-md" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 py-3 border-b border-white/20">
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
                      "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white transition-colors rounded-lg mx-2",
                      item.active && "bg-white/20 border-r-4 border-blue-300 font-medium text-white"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 mr-3 text-white/60 drop-shadow-md",
                      item.active && "text-blue-300"
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
                  <p className="text-xs font-medium text-white/60 tracking-wider uppercase drop-shadow-md">Admin</p>
                </div>
                <ul>
                  {adminItems.map((item) => (
                    <li key={item.title}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white transition-colors rounded-lg mx-2",
                          item.active && "bg-white/20 border-r-4 border-blue-300 font-medium text-white"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5 mr-3 text-white/60 drop-shadow-md",
                          item.active && "text-blue-300"
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
        <div className="p-4 border-t border-white/20 bg-white/5">
          <button 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="flex items-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg px-2 py-2 transition-colors w-full"
          >
            <LogOut className="h-5 w-5 mr-3 drop-shadow-md" />
            <span className="drop-shadow-md">Log out</span>
          </button>
        </div>
      </div>
    </>
  );
}
