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
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
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
      title: "Goals",
      href: "/goals",
      icon: Zap,
      active: location === "/goals",
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
  ];

  return (
    <aside className={cn("hidden md:flex flex-col w-64 bg-white border-r border-gray-200", className)}>
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold font-heading text-neutral-darker flex items-center">
          <span className="text-primary mr-2">Momentum</span>Run
        </h1>
      </div>
      
      <nav className="flex-grow overflow-y-auto">
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-neutral-medium tracking-wider uppercase">Main</p>
        </div>
        <ul>
          {navItems.map((item) => (
            <li key={item.title}>
              <Link href={item.href}>
                <a className={cn(
                  "flex items-center px-4 py-3 text-neutral-dark hover:bg-neutral-lighter",
                  item.active && "bg-primary-light/30 border-r-4 border-primary font-medium text-neutral-darker"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 mr-3 text-neutral-medium",
                    item.active && "text-primary"
                  )} />
                  {item.title}
                </a>
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
                <a className={cn(
                  "flex items-center px-4 py-3 text-neutral-dark hover:bg-neutral-lighter",
                  item.active && "bg-primary-light/30 border-r-4 border-primary font-medium text-neutral-darker"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 mr-3 text-neutral-medium",
                    item.active && "text-primary"
                  )} />
                  {item.title}
                </a>
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
