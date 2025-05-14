import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ListTodo,
  Activity,
  Zap,
  User,
  Settings,
  LogOut,
  CreditCard,
  Crown,
  Dumbbell,
  Heart,
  Apple,
  Search,
} from "lucide-react";
import { SearchButton } from "@/components/common/search-dialog-fixed";

interface SidebarProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Sidebar({ className, style }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
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
  ];
  
  const accountNavItems = [
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
  ];

  const accountItems = [
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
      isPremium: true,
    },
  ];

  return (
    <aside className={cn("hidden md:flex md:visible flex-col w-64 bg-white border-r border-gray-200", className)}>
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold font-heading text-neutral-darker flex items-center">
          <span className="text-primary mr-2">Momentum</span>Run
        </h1>
      </div>
      
      <div className="px-4 py-3 border-b border-gray-200">
        <SearchButton />
      </div>
      
      <nav className="flex-grow overflow-y-auto">
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-neutral-medium tracking-wider uppercase">Main</p>
        </div>
        <ul>
          {navItems.map((item) => (
            <li key={item.title}>
              <Link href={item.href}>
                <div className={cn(
                  "flex items-center px-4 py-3 text-neutral-dark hover:bg-neutral-lighter cursor-pointer",
                  item.active && "bg-primary-light/30 border-r-4 border-primary font-medium text-neutral-darker"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 mr-3 text-neutral-medium",
                    item.active && "text-primary"
                  )} />
                  {item.title}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-neutral-medium tracking-wider uppercase">Account</p>
        </div>
        <ul>
          {accountItems.map((item) => (
            <li key={item.title}>
              <Link href={item.href}>
                <div className={cn(
                  "flex items-center px-4 py-3 text-neutral-dark hover:bg-neutral-lighter cursor-pointer",
                  item.active && "bg-primary-light/30 border-r-4 border-primary font-medium text-neutral-darker"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 mr-3 text-neutral-medium",
                    item.active && "text-primary"
                  )} />
                  <div className="flex items-center">
                    {item.title}
                    {item.isPremium && (
                      <Crown className="h-3.5 w-3.5 ml-2 text-amber-500" />
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="flex items-center text-neutral-dark hover:text-primary"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Log out
        </button>
      </div>
    </aside>
  );
}
