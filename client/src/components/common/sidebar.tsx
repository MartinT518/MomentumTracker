import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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

import sinine_musttaust from "@assets/sinine_musttaust.png";

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
    <aside className={cn("hidden lg:flex flex-col w-64 bg-white/10 backdrop-blur-xl border-r border-white/20", className)} style={style}>
      <div className="p-4 border-b border-white/20">
        <Link href="/dashboard">
          <div className="flex items-center">
            <img 
              src={sinine_musttaust} 
              alt="AetherRun Logo" 
              className="w-full h-96 object-contain mt-[-174px] mb-[-174px] pt-[0px] pb-[0px] pl-[0px] pr-[0px] ml-[0px] mr-[0px]"
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
          {navItems.map((item, index) => (
            <motion.li 
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={item.href}>
                <motion.div 
                  className={cn(
                    "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 rounded-lg mx-2",
                    item.active && "bg-white/20 border-l-4 border-cyan-300 font-medium text-white"
                  )}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <item.icon className={cn(
                    "h-5 w-5 mr-3 text-white/60",
                    item.active && "text-cyan-300"
                  )} />
                  {item.title}
                </motion.div>
              </Link>
            </motion.li>
          ))}
        </ul>
        
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-white/70 tracking-wider uppercase drop-shadow-sm">Account</p>
        </div>
        <ul>
          {accountItems.map((item, index) => (
            <motion.li 
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: (index + navItems.length) * 0.05 }}
            >
              <Link href={item.href}>
                <motion.div 
                  className={cn(
                    "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 rounded-lg mx-2",
                    item.active && "bg-white/20 border-l-4 border-cyan-300 font-medium text-white"
                  )}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <item.icon className={cn(
                    "h-5 w-5 mr-3 text-white/60",
                    item.active && "text-cyan-300"
                  )} />
                  {item.title}
                </motion.div>
              </Link>
            </motion.li>
          ))}
        </ul>
        
        {/* Additional navigation items */}
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-medium text-white/70 tracking-wider uppercase drop-shadow-sm">Support</p>
        </div>
        <ul>
          <motion.li
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: (navItems.length + accountItems.length) * 0.05 }}
          >
            <Link href="/faq">
              <motion.div 
                className={cn(
                  "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 rounded-lg mx-2",
                  location === "/faq" && "bg-white/20 border-l-4 border-cyan-300 font-medium text-white"
                )}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <HelpCircle className={cn(
                  "h-5 w-5 mr-3 text-white/60",
                  location === "/faq" && "text-cyan-300"
                )} />
                FAQ & Support
              </motion.div>
            </Link>
          </motion.li>
          <motion.li
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: (navItems.length + accountItems.length + 1) * 0.05 }}
          >
            <Link href="/pricing">
              <motion.div 
                className={cn(
                  "flex items-center px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer transition-all duration-200 rounded-lg mx-2",
                  location === "/pricing" && "bg-white/20 border-l-4 border-cyan-300 font-medium text-white"
                )}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <DollarSign className={cn(
                  "h-5 w-5 mr-3 text-white/60",
                  location === "/pricing" && "text-cyan-300"
                )} />
                Pricing
              </motion.div>
            </Link>
          </motion.li>
        </ul>
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
