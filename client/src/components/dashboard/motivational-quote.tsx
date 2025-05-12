import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, Sparkles, ArrowRightCircle } from 'lucide-react';

interface MotivationalQuote {
  text: string;
  author: string;
  category: 'running' | 'fitness' | 'motivation' | 'persistence';
}

const quotes: MotivationalQuote[] = [
  {
    text: "The miracle isn't that I finished. The miracle is that I had the courage to start.",
    author: "John Bingham",
    category: "running"
  },
  {
    text: "Running is the greatest metaphor for life, because you get out of it what you put into it.",
    author: "Oprah Winfrey",
    category: "running"
  },
  {
    text: "Pain is temporary. Quitting lasts forever.",
    author: "Lance Armstrong",
    category: "persistence"
  },
  {
    text: "If you don't have answers to your problems after a four-hour run, you ain't getting them.",
    author: "Christopher McDougall",
    category: "running"
  },
  {
    text: "It's supposed to be hard. If it wasn't hard, everyone would do it. The hard is what makes it great.",
    author: "Tom Hanks",
    category: "persistence"
  },
  {
    text: "Don't dream of winning, train for it!",
    author: "Mo Farah",
    category: "fitness"
  },
  {
    text: "The difference between the impossible and the possible lies in a person's determination.",
    author: "Tommy Lasorda",
    category: "motivation"
  },
  {
    text: "The only bad workout is the one that didn't happen.",
    author: "Unknown",
    category: "fitness"
  },
  {
    text: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair",
    category: "motivation"
  },
  {
    text: "Life begins at the end of your comfort zone.",
    author: "Neale Donald Walsch",
    category: "motivation"
  },
  {
    text: "Running allows me to set my mind free. Nothing seems impossible. Nothing unattainable.",
    author: "Kara Goucher",
    category: "running"
  },
  {
    text: "The body achieves what the mind believes.",
    author: "Unknown",
    category: "fitness"
  }
];

export function MotivationalQuoteCard() {
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(quotes[0]);
  const [fadeIn, setFadeIn] = useState(true);

  // Function to get a random quote
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  };

  // Initialize with a random quote
  useEffect(() => {
    setCurrentQuote(getRandomQuote());
  }, []);

  // Function to cycle to next quote with fade animation
  const cycleQuote = () => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentQuote(getRandomQuote());
      setFadeIn(true);
    }, 300);
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 border-none shadow hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-start">
        <div className="text-primary/80 mr-3 mt-1">
          <Quote className="h-5 w-5" />
        </div>
        <div className={`flex-1 transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-neutral-darker font-medium text-base italic mb-2">{currentQuote.text}</p>
          <div className="flex justify-between items-center">
            <p className="text-neutral-medium text-sm">— {currentQuote.author}</p>
            <button 
              onClick={cycleQuote}
              className="text-primary/70 hover:text-primary transition-colors flex items-center text-xs"
            >
              New Quote <ArrowRightCircle className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyMotivation() {
  // Get day of week
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
  
  // Map day to motivation message
  const motivationMap = [
    { // Sunday
      title: "Rest & Recover",
      message: "Take time to recharge today. Your body grows stronger during recovery."
    },
    { // Monday
      title: "Start Strong",
      message: "Set the tone for your week with a focused effort today!"
    },
    { // Tuesday
      title: "Build Momentum",
      message: "Your consistency is creating a foundation for success."
    },
    { // Wednesday
      title: "Midweek Power",
      message: "You're halfway there! Push through the midweek challenge."
    },
    { // Thursday
      title: "Stay Committed",
      message: "Your dedication today brings you one step closer to your goals."
    },
    { // Friday
      title: "Finish Strong",
      message: "Cap off your week with pride in what you've accomplished!"
    },
    { // Saturday
      title: "Weekend Warrior",
      message: "Make the most of today's session - you've earned this training day!"
    }
  ];
  
  const todayMotivation = motivationMap[dayOfWeek];
  
  return (
    <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 rounded-xl mb-6 flex items-center">
      <Sparkles className="h-8 w-8 text-primary mr-4 flex-shrink-0" />
      <div>
        <h3 className="font-medium text-lg text-neutral-darker">{todayMotivation.title}</h3>
        <p className="text-neutral-medium">{todayMotivation.message}</p>
      </div>
    </div>
  );
}