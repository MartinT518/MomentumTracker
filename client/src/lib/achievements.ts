import confetti from 'canvas-confetti';

export interface Achievement {
  id: number;
  user_id: number;
  title: string;
  description: string;
  achievement_type: string;
  badge_image?: string;
  earned_at: Date;
  times_earned: number;
  viewed: boolean;
  achievement_data?: any;
  type?: string; // Backward compatibility
  progress?: {
    current: number;
    target: number;
    unit: string;
  };
}

// Function to display confetti celebration animation
export function celebrateWithConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Create burst of confetti from both sides
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}