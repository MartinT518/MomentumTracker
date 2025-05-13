import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import { SearchButton } from "@/components/common/search-dialog";

export function MobileMenu() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

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
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold font-heading text-neutral-darker flex items-center">
            <span className="text-primary mr-1">Momentum</span>Run
          </h1>
          <button 
            className="p-1 rounded-md hover:bg-neutral-lighter"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 text-neutral-darker" />
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
          "fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-30",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold font-heading text-neutral-darker">
            <span className="text-primary mr-2">Momentum</span>Run
          </h1>
          <button 
            className="p-1 rounded-md hover:bg-neutral-lighter"
            onClick={closeMenu}
          >
            <X className="h-6 w-6 text-neutral-darker" />
          </button>
        </div>
        
        <div className="px-4 py-3 border-b border-gray-200">
          <SearchButton />
        </div>

        <nav className="overflow-y-auto">
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
        </nav>

        <div className="p-4 border-t border-gray-200 mt-4">
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
