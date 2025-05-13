import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const RunnerAnimation = () => {
  const [energy, setEnergy] = useState(50);
  
  // Simulate energy level fluctuations as if AI is analyzing the runner
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => {
        const newValue = prev + (Math.random() * 10 - 5);
        return Math.min(Math.max(newValue, 30), 85); // Keep within reasonable bounds
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate runner speed based on energy
  const speed = 0.8 + (energy / 100) * 0.4;
  
  return (
    <div className="relative w-full h-[300px] overflow-hidden">
      {/* Background track gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/30 rounded-xl" />
      
      {/* AI analysis lines */}
      <div className="absolute left-0 right-0 top-0 h-16 flex items-end justify-around px-2">
        {[...Array(20)].map((_, i) => (
          <motion.div 
            key={i}
            className="bg-primary/70 w-1 rounded-t-full"
            initial={{ height: Math.random() * 10 + 2 }}
            animate={{ 
              height: Math.random() * 20 + 5,
              transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" }
            }}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      
      {/* Running track */}
      <div className="absolute bottom-16 left-0 right-0 h-2 bg-gray-600" />
      
      {/* Runner figure */}
      <motion.div 
        className="absolute bottom-16 h-24 w-24"
        animate={{ 
          x: [0, '100%', '0%'],
          scaleX: [1, 1, -1, -1, 1],
        }}
        transition={{ 
          duration: 6 / speed, 
          repeat: Infinity, 
          ease: "linear",
          times: [0, 0.5, 0.5, 1, 1]
        }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {/* Body */}
          <motion.path 
            d="M40,30 C40,30 45,20 55,25 C65,30 60,40 60,40 L55,60 L45,60 L40,30" 
            fill="#2563EB"
            animate={{ 
              d: [
                "M40,30 C40,30 45,20 55,25 C65,30 60,40 60,40 L55,60 L45,60 L40,30",
                "M40,32 C40,32 45,22 55,27 C65,32 60,42 60,42 L55,62 L45,62 L40,32",
                "M40,30 C40,30 45,20 55,25 C65,30 60,40 60,40 L55,60 L45,60 L40,30"
              ]
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          
          {/* Head */}
          <circle cx="55" cy="20" r="8" fill="#2563EB" />
          
          {/* Arms */}
          <motion.path 
            d="M45,35 L30,45 M55,35 L70,45" 
            stroke="#2563EB" 
            strokeWidth="4"
            strokeLinecap="round"
            animate={{ 
              d: [
                "M45,35 L30,45 M55,35 L70,45",
                "M45,35 L35,30 M55,35 L65,30",
                "M45,35 L30,45 M55,35 L70,45"
              ]
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          
          {/* Legs */}
          <motion.path 
            d="M45,60 L35,80 M55,60 L65,80" 
            stroke="#2563EB" 
            strokeWidth="4"
            strokeLinecap="round"
            animate={{ 
              d: [
                "M45,60 L35,80 M55,60 L65,80",
                "M45,60 L45,80 M55,60 L55,80",
                "M45,60 L65,80 M55,60 L35,80",
                "M45,60 L45,80 M55,60 L55,80",
                "M45,60 L35,80 M55,60 L65,80"
              ]
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        </svg>
      </motion.div>
      
      {/* Energy meter */}
      <div className="absolute bottom-4 left-4 right-4 bg-gray-800/70 h-8 rounded-full overflow-hidden flex items-center px-2">
        <div className="absolute left-3 text-xs text-white font-bold">AI ENERGY ANALYSIS</div>
        <motion.div 
          className="h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
          animate={{ width: `${energy}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* AI metrics popup */}
      <motion.div 
        className="absolute top-20 right-4 bg-black/70 p-3 rounded-lg text-white text-xs w-48"
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: [0, 1, 1, 0],
          y: [-20, 0, 0, -20]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          repeatDelay: 2,
          times: [0, 0.1, 0.9, 1]
        }}
      >
        <div className="font-bold mb-1">AI INSIGHTS:</div>
        <div className="flex justify-between mb-1">
          <span>Pace:</span>
          <span>{(10 - (energy / 10)).toFixed(1)} min/mi</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Stride Length:</span>
          <span>{(energy / 10 + 2).toFixed(1)} ft</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Form Efficiency:</span>
          <span>{energy.toFixed(0)}%</span>
        </div>
      </motion.div>
    </div>
  );
};

export default RunnerAnimation;