import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const trainingTypes = [
  "Easy Run",
  "Tempo Run",
  "Interval Training",
  "Long Run",
  "Recovery Run",
  "Hill Repeats",
  "Fartlek",
  "Race Pace",
  "Speed Work"
];

const workoutPatterns = [
  [3, 4, 2, 5, 1, 0],
  [0, 5, 8, 2, 1, 6],
  [1, 3, 0, 7, 2, 4],
  [2, 0, 6, 3, 8, 1]
];

export const AITrainingGenerator = () => {
  const [currentPattern, setCurrentPattern] = useState(0);
  const [generating, setGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate AI generating a plan
    const interval = setInterval(() => {
      if (generating) {
        setProgress(prev => {
          if (prev >= 100) {
            setGenerating(false);
            return 100;
          }
          return prev + 5;
        });
      } else {
        setTimeout(() => {
          setCurrentPattern(prev => (prev + 1) % workoutPatterns.length);
          setGenerating(true);
          setProgress(0);
        }, 3000);
      }
    }, 200);
    
    return () => clearInterval(interval);
  }, [generating]);
  
  const pattern = workoutPatterns[currentPattern];
  
  return (
    <div className="relative w-full h-[300px] bg-gray-800/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-3 text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">AI TRAINING PLAN GENERATOR</h3>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${generating ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-xs">{generating ? 'ANALYZING' : 'COMPLETE'}</span>
          </div>
        </div>
      </div>
      
      {/* AI processing visualization */}
      <div className="absolute top-16 left-0 right-0 px-4 py-2">
        {generating && (
          <div className="space-y-2">
            <div className="text-xs text-white mb-1">ANALYZING RUNNER PROFILE...</div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Evaluating Goals</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Weekly plan visualization */}
      <div className="absolute bottom-4 left-4 right-4 top-36">
        <div className="grid grid-cols-7 gap-1 h-full">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={day + i} className="flex flex-col h-full">
              <div className="text-center text-xs text-white mb-1">{day}</div>
              <div className={`flex-1 rounded bg-gray-700/70 relative overflow-hidden
                ${generating ? 'opacity-50' : 'opacity-100'}`}>
                {i < 6 && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center text-xs text-white p-1 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: generating ? 0 : 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {i < pattern.length ? trainingTypes[pattern[i]] : "Rest"}
                  </motion.div>
                )}
                
                {i === 6 && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center text-xs text-white p-1 text-center bg-gradient-to-br from-blue-900/80 to-purple-900/80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: generating ? 0 : 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Rest
                  </motion.div>
                )}
                
                {generating && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* AI processing dots */}
      {generating && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-500 rounded-full"
              initial={{ 
                x: Math.random() * 100 + 50, 
                y: Math.random() * 100 + 50,
                opacity: 0
              }}
              animate={{ 
                x: Math.random() * 300, 
                y: Math.random() * 200,
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                delay: i * 0.1,
                repeatDelay: 1
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AITrainingGenerator;