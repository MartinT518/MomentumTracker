import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

// Loading indicator that appears during transitions
export function NavigationLoader() {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location);

  useEffect(() => {
    if (location !== prevLocation) {
      setIsLoading(true);
      setPrevLocation(location);
      
      // Hide loader after transition completes
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [location, prevLocation]);

  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"
      style={{
        transformOrigin: "left center",
      }}
    />
  );
}

// Enhanced link component with preloading animations
interface AnimatedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AnimatedLink({ href, children, className = "", onClick }: AnimatedLinkProps) {
  return (
    <motion.a
      href={href}
      className={className}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.a>
  );
}

// Staggered animations for page content
export function StaggeredContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}