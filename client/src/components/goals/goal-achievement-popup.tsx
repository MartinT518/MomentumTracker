import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Trophy, Star, PartyPopper, Firework, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AchievementPopupProps {
  open: boolean;
  onClose: () => void;
  achievement: {
    id: number;
    title: string;
    description: string;
    type: string;
    achievedDate: string;
    progress?: {
      current: number;
      target: number;
      unit: string;
    };
  };
}

export function GoalAchievementPopup({ open, onClose, achievement }: AchievementPopupProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      // Show animation when the popup appears
      setShowConfetti(true);
      
      // Use setTimeout to create a staggered effect
      setTimeout(() => {
        // Create confetti effect (just a visual in the component)
        const confettiElements = document.querySelectorAll('.confetti-piece');
        confettiElements.forEach((el, i) => {
          const element = el as HTMLElement;
          element.style.animationDelay = `${i * 0.1}s`;
          element.style.display = 'block';
        });
      }, 300);
      
      return () => {
        setShowConfetti(false);
      };
    }
  }, [open]);

  const getAchievementIcon = () => {
    switch (achievement.type) {
      case 'race':
        return <Trophy className="h-16 w-16 text-primary" />;
      case 'milestone':
        return <Award className="h-16 w-16 text-secondary" />;
      case 'streak':
        return <Firework className="h-16 w-16 text-accent" />;
      case 'personal_best':
        return <Star className="h-16 w-16 text-yellow-500" />;
      default:
        return <PartyPopper className="h-16 w-16 text-primary" />;
    }
  };

  const shareAchievement = () => {
    if (navigator.share) {
      navigator.share({
        title: `I just achieved a goal on MomentumRun!`,
        text: `I just completed "${achievement.title}" - ${achievement.description}`,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      console.log('Web Share API not supported');
      // Could implement a direct link to social media or copy to clipboard here
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Goal Achieved!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 relative">
          {/* Confetti animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <div 
                key={i}
                className="confetti-piece absolute hidden"
                style={{
                  top: '-10%',
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  backgroundColor: ['#5E60CE', '#64DFDF', '#80FFDB', '#FFD166', '#EF476F'][Math.floor(Math.random() * 5)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  animation: `fall ${Math.random() * 3 + 2}s linear forwards`,
                }}
              />
            ))}
          </div>
          
          <AnimatePresence>
            {showConfetti && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="mb-4"
              >
                {getAchievementIcon()}
              </motion.div>
            )}
          </AnimatePresence>
          
          <h3 className="text-xl font-semibold text-center mb-2">{achievement.title}</h3>
          <p className="text-center text-muted-foreground mb-4">{achievement.description}</p>
          
          {achievement.progress && (
            <div className="bg-primary/10 rounded-lg p-3 mb-4 w-full">
              <p className="text-center font-medium">
                {achievement.progress.current}{achievement.progress.unit} / {achievement.progress.target}{achievement.progress.unit}
              </p>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mb-6">
            Achieved on {new Date(achievement.achievedDate).toLocaleDateString()}
          </p>
          
          <div className="flex space-x-3 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Got it
            </Button>
            <Button className="flex-1" onClick={shareAchievement}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}