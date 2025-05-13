import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SiStrava, SiGarmin } from "react-icons/si";
import { Heart, Activity, Watch, Zap, Target } from "lucide-react";

const integrationData = [
  { 
    name: "STRAVA",
    icon: SiStrava,
    color: "#FC4C02",
    metrics: [
      { name: "Runs", value: 237, unit: "" },
      { name: "Distance", value: 1289, unit: "mi" },
      { name: "Elevation", value: 27543, unit: "ft" }
    ]
  },
  { 
    name: "GARMIN",
    icon: SiGarmin,
    color: "#007CC3",
    metrics: [
      { name: "Heart Rate", value: 62, unit: "bpm" },
      { name: "Sleep", value: 7.2, unit: "hrs" },
      { name: "VO2 Max", value: 48, unit: "" }
    ]
  },
  { 
    name: "POLAR",
    icon: Target, // Using Target icon from Lucide instead of SiPolar
    color: "#D40029",
    metrics: [
      { name: "HRV", value: 72, unit: "ms" },
      { name: "Training Load", value: 165, unit: "" },
      { name: "Recovery", value: 86, unit: "%" }
    ]
  }
];

export const FitnessIntegration = () => {
  const [activeIntegration, setActiveIntegration] = useState(0);
  const [syncing, setSyncing] = useState(false);
  
  useEffect(() => {
    // Every 5 seconds, change the active integration
    const interval = setInterval(() => {
      setActiveIntegration(prev => (prev + 1) % integrationData.length);
      setSyncing(true);
      
      // After 2 seconds, stop "syncing"
      setTimeout(() => {
        setSyncing(false);
      }, 2000);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const currentIntegration = integrationData[activeIntegration];
  
  return (
    <div className="relative w-full h-[300px] bg-black/40 rounded-xl overflow-hidden text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">FITNESS DEVICE INTEGRATIONS</h3>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${syncing ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            <span className="text-xs">{syncing ? 'SYNCING...' : 'CONNECTED'}</span>
          </div>
        </div>
      </div>
      
      {/* Integrations icons */}
      <div className="flex justify-center space-x-6 mt-4">
        {integrationData.map((integration, idx) => {
          const Icon = integration.icon;
          return (
            <motion.div 
              key={integration.name}
              className={`rounded-full p-4 ${idx === activeIntegration ? 'bg-gray-800' : 'bg-gray-800/30'}`}
              whileHover={{ scale: 1.1 }}
              animate={{ 
                scale: idx === activeIntegration ? [1, 1.1, 1] : 1,
                transition: { duration: 0.5 }
              }}
              onClick={() => setActiveIntegration(idx)}
            >
              <Icon 
                size={24} 
                color={idx === activeIntegration ? integration.color : '#666'} 
              />
            </motion.div>
          );
        })}
      </div>
      
      {/* Current integration data */}
      <motion.div 
        className="mt-6 px-4"
        key={activeIntegration}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center mb-4">
          {activeIntegration === 0 && <Activity className="mr-2" size={18} />}
          {activeIntegration === 1 && <Watch className="mr-2" size={18} />}
          {activeIntegration === 2 && <Heart className="mr-2" size={18} />}
          <h4 className="font-semibold">{currentIntegration.name} DATA INSIGHTS</h4>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {currentIntegration.metrics.map((metric) => (
            <div key={metric.name} className="bg-gray-800/60 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">{metric.name}</div>
              <div className="flex items-end">
                <div className="text-xl font-bold">{metric.value}</div>
                {metric.unit && <div className="text-xs ml-1 mb-1 text-gray-400">{metric.unit}</div>}
              </div>
            </div>
          ))}
        </div>
        
        {/* AI Analysis */}
        <div className="mt-6 bg-blue-900/30 rounded-lg p-3 border border-blue-700/30">
          <div className="flex items-center">
            <Zap size={16} className="mr-2 text-yellow-400" />
            <div className="text-sm font-semibold">AI INSIGHTS</div>
          </div>
          <motion.div 
            className="text-sm mt-2 leading-snug"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {activeIntegration === 0 && "Your running consistency has improved by 23% in the last month. Your preferred routes show steady pace improvements."}
            {activeIntegration === 1 && "Morning runs show better performance metrics. Your recovery periods are optimal based on heart rate variability data."}
            {activeIntegration === 2 && "Your HRV trend indicates improving fitness. Consider lower intensity on Thursday based on your recovery pattern."}
          </motion.div>
        </div>
      </motion.div>
      
      {/* Syncing animation */}
      {syncing && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-32 h-32 rounded-full border-4 border-t-transparent border-blue-500 animate-spin opacity-30"></div>
          </div>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              initial={{ 
                x: '50%', 
                y: '50%',
                opacity: 0
              }}
              animate={{ 
                x: `${Math.random() * 100}%`, 
                y: `${Math.random() * 100}%`,
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2, 
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FitnessIntegration;