import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
} from "react";
import { GoalAchievementPopup } from "@/components/goals/goal-achievement-popup";

interface Achievement {
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
}

interface AchievementsContextType {
  showAchievement: (achievement: Achievement) => void;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(
  undefined
);

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const [currentAchievement, setCurrentAchievement] =
    useState<Achievement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showAchievement = useCallback((achievement: Achievement) => {
    // Close any existing achievement popup
    setIsOpen(false);
    
    // Wait a bit to ensure clean transition between popups
    setTimeout(() => {
      setCurrentAchievement(achievement);
      setIsOpen(true);
    }, 300);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Clear the achievement after animation completes
    setTimeout(() => {
      setCurrentAchievement(null);
    }, 300);
  }, []);

  return (
    <AchievementsContext.Provider value={{ showAchievement }}>
      {children}
      {currentAchievement && (
        <GoalAchievementPopup
          open={isOpen}
          onClose={handleClose}
          achievement={currentAchievement}
        />
      )}
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementsContext);

  if (context === undefined) {
    throw new Error(
      "useAchievements must be used within an AchievementsProvider"
    );
  }

  return context;
}