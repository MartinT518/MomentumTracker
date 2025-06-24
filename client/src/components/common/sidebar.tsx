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
  ShieldCheck,
  UserCog,
  Users,
  Target,
  HelpCircle,
  DollarSign,
} from "lucide-react";
import { SearchButton } from "@/components/common/search-dialog-fixed";
import catholicRunLogo from "@assets/688bcfbe-f276-4711-8a45-55f25a921b52_20250624_231034_0000_1750795883864.png";

interface SidebarProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Sidebar({ className, style }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Check if user is an admin
  const isAdmin = user?.is_admin;

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
  ];
  
  const adminItems = [
    {
      title: "Admin Panel",
      href: "/admin",
      icon: Crown,
      active: location === "/admin",
    },
    {
      title: "Coach Management",
      href: "/admin/coaches",
      icon: UserCog,
      active: location === "/admin/coaches",
    },
  ];

  return (
    <aside className={cn("hidden lg:flex flex-col w-64 bg-white/10 backdrop-blur-xl border-r border-white/20", className)} style={style}>
      <div className="p-4 border-b border-white/20">
        <Link href="/dashboard">
          <div className="flex items-center">
            <img 
              src={catholicRunLogo} 
              alt="AetherRun Logo" 
              className="w-full h-96 object-contain"
            />
          </div>
        </Link>
      </div>
      
      <div className="px-4 py-3 border-b border-white/20">
        <SearchButton />
      </div>
      
      {/* Admin quick access for admin users */}
      {isAdmin && (
        <div className="px-4 py-3 border-b border-white/20">
          <Link href="/admin">
            <div className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-lg text-purple-300 hover:from-purple-500/30 hover:to-pink-600/30 hover:text-purple-200 transition-all">
              <Crown className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Admin Panel</span>
            </div>
          </Link>
        </div>
      )}
      
      <nav className="flex-grow overflow-y-auto">
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-white/70 tracking-wider uppercase drop-shadow-sm">Main</p>
        </div>
        <ul>
          {navItems.map((item) => (
            <li key={item.title}>
              <Link href={item.href}>
                <div className={cn(
                  "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 rounded-lg mx-2",
                  item.active && "bg-white/20 border-l-4 border-cyan-300 font-medium text-white"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 mr-3 text-white/60",
                    item.active && "text-cyan-300"
                  )} />
                  {item.title}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-white/70 tracking-wider uppercase drop-shadow-sm">Account</p>
        </div>
        <ul>
          {accountItems.map((item) => (
            <li key={item.title}>
              <Link href={item.href}>
                <div className={cn(
                  "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 rounded-lg mx-2",
                  item.active && "bg-white/20 border-l-4 border-cyan-300 font-medium text-white"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 mr-3 text-white/60",
                    item.active && "text-cyan-300"
                  )} />
                  {item.title}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        {/* Additional navigation items */}
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-white/70 tracking-wider uppercase drop-shadow-sm">Support</p>
        </div>
        <ul>
          <li>
            <Link href="/faq">
              <div className={cn(
                "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 rounded-lg mx-2",
                location === "/faq" && "bg-white/20 border-l-4 border-cyan-300 font-medium text-white"
              )}>
                <HelpCircle className={cn(
                  "h-5 w-5 mr-3 text-white/60",
                  location === "/faq" && "text-cyan-300"
                )} />
                FAQ & Support
              </div>
            </Link>
          </li>
          <li>
            <Link href="/pricing">
              <div className={cn(
                "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 rounded-lg mx-2",
                location === "/pricing" && "bg-white/20 border-l-4 border-cyan-300 font-medium text-white"
              )}>
                <DollarSign className={cn(
                  "h-5 w-5 mr-3 text-white/60",
                  location === "/pricing" && "text-cyan-300"
                )} />
                Pricing
              </div>
            </Link>
          </li>
        </ul>
        
        {/* Only show admin section to admin users */}
        {isAdmin && (
          <>
            <div className="px-4 pt-6 pb-2">
              <p className="text-xs font-medium text-white/70 tracking-wider uppercase drop-shadow-sm">Admin</p>
            </div>
            <ul>
              {adminItems.map((item) => (
                <li key={item.title}>
                  <Link href={item.href}>
                    <div className={cn(
                      "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 rounded-lg mx-2",
                      item.active && "bg-white/20 border-l-4 border-cyan-300 font-medium text-white"
                    )}>
                      <item.icon className={cn(
                        "h-5 w-5 mr-3 text-white/60",
                        item.active && "text-cyan-300"
                      )} />
                      {item.title}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>
      
      <div className="p-4 border-t border-white/20">
        <button 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="flex items-center text-white/80 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Log out
        </button>
      </div>
    </aside>
  );
}
