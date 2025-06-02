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
import aetherRunLogo from "@assets/Minimalist_AetherRun_logo_with_Aether_in_bold_-1747657788061.png";

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

  // Check if user is an admin (in a real app, this would check a proper admin role)
  const isAdmin = user?.id === 1;

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
      title: "Community",
      href: "/community",
      icon: Users,
      active: location === "/community",
    },
    {
      title: "Achievements",
      href: "/achievements",
      icon: Crown,
      active: location === "/achievements",
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
      title: "Billing",
      href: "/pricing",
      icon: CreditCard,
      active: location === "/pricing",
      isPremium: true,
    },
  ];
  
  const adminItems = [
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
          <div className="flex items-center space-x-2">
            <img 
              src={aetherRunLogo} 
              alt="AetherRun Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-white">
              <span className="text-cyan-300">Aether</span>Run
            </span>
          </div>
        </Link>
      </div>
      
      <div className="px-4 py-3 border-b border-white/20">
        <SearchButton />
      </div>
      
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
                  <div className="flex items-center">
                    {item.title}
                    {item.isPremium && (
                      <Crown className="h-3.5 w-3.5 ml-2 text-amber-400" />
                    )}
                  </div>
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
