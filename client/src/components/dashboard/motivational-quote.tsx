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
  },
  {
    text: "Motivation is what gets you started. Habit is what keeps you going.",
    author: "Jim Ryun",
    category: "persistence"
  },
  {
    text: "I run because if I didn't, I'd be sluggish and glum and spend too much time on the couch.",
    author: "Pete Magill",
    category: "running"
  },
  {
    text: "Your body will argue that there is no justifiable reason to continue. Your only recourse is to call on your spirit, which fortunately functions independently of logic.",
    author: "Tim Noakes",
    category: "persistence"
  },
  {
    text: "If it doesn't challenge you, it won't change you.",
    author: "Fred DeVito",
    category: "fitness"
  },
  {
    text: "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success. Greatness will come.",
    author: "Dwayne Johnson",
    category: "persistence"
  },
  {
    text: "Running is alone time that lets my brain unspool the tangles that build up over days.",
    author: "Rob Haneisen",
    category: "running"
  },
  {
    text: "The voice inside your head that says you can't do this is a liar.",
    author: "Unknown",
    category: "motivation"
  },
  {
    text: "Most people never run far enough on their first wind to find out they've got a second.",
    author: "William James",
    category: "running"
  },
  {
    text: "A race is a work of art that people can look at and be affected in as many ways as they're capable of understanding.",
    author: "Steve Prefontaine",
    category: "running"
  },
  {
    text: "If you are losing faith in human nature, go out and watch a marathon.",
    author: "Kathrine Switzer",
    category: "running"
  },
  {
    text: "To give anything less than your best is to sacrifice the gift.",
    author: "Steve Prefontaine",
    category: "motivation"
  },
  {
    text: "Run when you can, walk if you have to, crawl if you must; just never give up.",
    author: "Dean Karnazes",
    category: "persistence"
  }
];

export function MotivationalQuoteCard() {
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(quotes[0]);
  const [fadeIn, setFadeIn] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MotivationalQuote['category'] | 'all'>('all');

  // Function to get a random quote, optionally filtered by category
  const getRandomQuote = (category?: MotivationalQuote['category']) => {
    const filteredQuotes = category && category !== 'all' 
      ? quotes.filter(q => q.category === category)
      : quotes;
      
    if (filteredQuotes.length === 0) return quotes[0]; // Fallback
    
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    return filteredQuotes[randomIndex];
  };

  // Initialize with a random quote
  useEffect(() => {
    setCurrentQuote(getRandomQuote());
  }, []);

  // Function to cycle to next quote with fade animation
  const cycleQuote = (category?: MotivationalQuote['category']) => {
    const targetCategory = category || activeCategory;
    
    setFadeIn(false);
    setTimeout(() => {
      setCurrentQuote(getRandomQuote(targetCategory === 'all' ? undefined : targetCategory));
      setFadeIn(true);
    }, 300);
  };
  
  // Function to change category filter and get a new quote
  const changeCategory = (category: MotivationalQuote['category'] | 'all') => {
    setActiveCategory(category);
    cycleQuote(category);
  };

  return (
    <Card className="overflow-hidden bg-white/10 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start mb-1">
          <div className="text-cyan-300 mr-4 mt-1 bg-cyan-400/30 p-2 rounded-full">
            <Quote className="h-5 w-5" />
          </div>
          <div className={`flex-1 transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-white font-medium text-base italic mb-3 leading-relaxed">{currentQuote.text}</p>
            <div className="flex justify-between items-center">
              <p className="text-white/80 text-sm font-semibold">— {currentQuote.author}</p>
              <span className="text-xs px-2 py-0.5 bg-white/20 text-white/90 rounded-full capitalize">
                {currentQuote.category}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap justify-between items-center">
          <div className="flex flex-wrap gap-1 text-xs mb-1">
            {(['all', 'running', 'fitness', 'motivation', 'persistence'] as const).map(category => (
              <button
                key={category}
                onClick={() => changeCategory(category)}
                className={`px-2.5 py-1 rounded-full transition-colors ${
                  activeCategory === category 
                    ? 'bg-cyan-400/30 text-white font-medium' 
                    : 'bg-white/10 hover:bg-white/20 text-white/70'
                }`}
              >
                {category === 'all' ? 'All Topics' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          <button 
            onClick={() => cycleQuote()}
            className="text-cyan-300 hover:text-cyan-200 transition-colors flex items-center text-xs bg-cyan-400/20 px-3 py-1.5 rounded-full"
          >
            New Quote <ArrowRightCircle className="ml-1.5 h-3 w-3" />
          </button>
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
      title: "Build Energy",
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
    <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent p-5 rounded-xl mb-6 shadow-sm border border-primary/10 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M50,10 L90,50 L50,90 L10,50 Z" fill="currentColor" className="text-primary" />
          <circle cx="50" cy="50" r="20" fill="currentColor" className="text-secondary" />
        </svg>
      </div>
      <div className="flex items-start z-10 relative">
        <div className="bg-white/80 rounded-full p-3 shadow-sm flex-shrink-0 mr-5">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-neutral-darker mb-1">{todayMotivation.title}</h3>
          <p className="text-neutral-medium leading-relaxed">{todayMotivation.message}</p>
        </div>
      </div>
    </div>
  );
}