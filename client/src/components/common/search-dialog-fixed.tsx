import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { 
  Search as SearchIcon, 
  BarChart, 
  CalendarDays, 
  UserCircle, 
  Settings, 
  CreditCard, 
  Dumbbell, 
  Heart, 
  Apple, 
  Sparkles,
  Target, 
  Activity, 
  LineChart, 
  Medal, 
  MessageCircle,
  Zap,
  Utensils,
  Scale,
  Users,
  Film,
  AtSign,
  RefreshCw
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  keywords?: string[];
}

// Comprehensive search data that covers all pages and features
const searchData: SearchResult[] = [
  // Dashboard
  {
    id: 'dashboard',
    title: 'Dashboard',
    category: 'Pages',
    description: 'View your activity summary and quick stats',
    url: '/dashboard',
    icon: <BarChart className="h-4 w-4" />,
    keywords: ['overview', 'summary', 'stats', 'home', 'main', 'energy', 'readiness', 'recovery']
  },
  // Activities
  {
    id: 'activities',
    title: 'Activities',
    category: 'Pages',
    description: 'Browse and manage your workouts and runs',
    url: '/activities',
    icon: <Activity className="h-4 w-4" />,
    keywords: ['workouts', 'runs', 'exercises', 'training', 'history', 'logs', 'running', 'cycling', 'swimming', 'cardio', 'pace', 'distance']
  },
  // Training Plan
  {
    id: 'training-plan',
    title: 'Training Plan',
    category: 'Pages',
    description: 'View and adjust your personalized training schedule',
    url: '/training-plan',
    icon: <CalendarDays className="h-4 w-4" />,
    keywords: ['schedule', 'plan', 'workouts', 'calendar', 'program', 'routine', 'weekly', 'monthly', 'sessions', 'custom']
  },
  // Goals
  {
    id: 'goals',
    title: 'Goals',
    category: 'Pages',
    description: 'Set and track your fitness objectives',
    url: '/goals',
    icon: <Target className="h-4 w-4" />,
    keywords: ['targets', 'objectives', 'achievements', 'milestones', 'progress', 'tracking', 'race', 'marathon', 'challenge']
  },
  // Strength Exercises
  {
    id: 'strength-exercises',
    title: 'Strength Exercises',
    category: 'Pages',
    description: 'Browse strength workouts and routines',
    url: '/strength-exercises',
    icon: <Dumbbell className="h-4 w-4" />,
    keywords: ['weights', 'resistance', 'gym', 'workout', 'lifting', 'muscle', 'conditioning', 'cross-training']
  },
  // Health Metrics
  {
    id: 'health-metrics',
    title: 'Health Metrics',
    category: 'Pages',
    description: 'Track your vital signs and health data',
    url: '/health-metrics',
    icon: <Heart className="h-4 w-4" />,
    keywords: ['biometrics', 'vitals', 'hrv', 'heart rate', 'sleep', 'recovery', 'weight', 'body fat', 'blood pressure', 'resting heart rate']
  },
  // Nutrition
  {
    id: 'nutrition',
    title: 'Nutrition',
    category: 'Pages',
    description: 'Track meals and get nutrition recommendations',
    url: '/nutrition',
    icon: <Apple className="h-4 w-4" />,
    keywords: ['meals', 'diet', 'food', 'recipes', 'hydration', 'calories', 'macros', 'eating', 'water']
  },
  // Profile
  {
    id: 'profile',
    title: 'User Profile',
    category: 'Account',
    description: 'View and update your personal information',
    url: '/profile',
    icon: <UserCircle className="h-4 w-4" />,
    keywords: ['account', 'personal', 'stats', 'bio', 'information', 'details']
  },
  // Settings
  {
    id: 'settings',
    title: 'Settings',
    category: 'Account',
    description: 'Configure app preferences and integrations',
    url: '/settings',
    icon: <Settings className="h-4 w-4" />,
    keywords: ['preferences', 'configuration', 'options', 'account', 'setup', 'customize', 'personalize', 'units', 'privacy']
  },
  // Subscription
  {
    id: 'subscription',
    title: 'Subscription',
    category: 'Account',
    description: 'Manage your premium membership',
    url: '/subscription',
    icon: <CreditCard className="h-4 w-4" />,
    keywords: ['premium', 'membership', 'billing', 'payment', 'plan', 'upgrade', 'features', 'annual', 'monthly']
  },
  
  // Training Preferences (Settings subsection)
  {
    id: 'training-preferences',
    title: 'Training Preferences',
    category: 'Settings',
    description: 'Update your training settings and goals',
    url: '/settings?tab=training',
    icon: <Target className="h-4 w-4" />,
    keywords: ['preferences', 'goals', 'thresholds', 'zones', 'paces', 'configuration', 'default', 'running', 'frequency']
  },
  
  // Third-party Integrations (Settings subsection)
  {
    id: 'integrations',
    title: 'Connected Services',
    category: 'Settings',
    description: 'Manage Strava, Garmin, and Polar connections',
    url: '/settings?tab=integrations',
    icon: <RefreshCw className="h-4 w-4" />,
    keywords: ['connect', 'strava', 'garmin', 'polar', 'sync', 'data', 'import', 'services', 'export', 'authorize']
  },

  // Annual subscription features
  {
    id: 'coaches',
    title: 'Coaches',
    category: 'Premium Features',
    description: 'Connect with running coaches (Annual subscription)',
    url: '/coaches',
    icon: <Users className="h-4 w-4" />,
    keywords: ['trainers', 'experts', 'advice', 'guidance', 'consultation', 'professional', 'coaching', 'mentoring', 'feedback', 'instruction']
  },
  {
    id: 'video-analysis',
    title: 'Video Analysis',
    category: 'Premium Features',
    description: 'Analyze your running form (Annual subscription)',
    url: '/video-analysis',
    icon: <Film className="h-4 w-4" />,
    keywords: ['form', 'technique', 'recording', 'biomechanics', 'gait', 'stride', 'posture', 'efficiency', 'feedback']
  },

  // Feature specific searches
  {
    id: 'pace-chart',
    title: 'Pace Improvement',
    category: 'Features',
    description: 'View your pace trends for similar runs',
    url: '/activities?chart=pace',
    icon: <LineChart className="h-4 w-4" />,
    keywords: ['speed', 'improvement', 'trend', 'progress', 'comparison', 'analytics', 'performance', 'tracking', 'time', 'statistics']
  },
  {
    id: 'achievements',
    title: 'Achievements',
    category: 'Features',
    description: 'View your earned badges and achievements',
    url: '/profile?tab=achievements',
    icon: <Medal className="h-4 w-4" />,
    keywords: ['badges', 'rewards', 'trophies', 'milestones', 'accomplishments', 'progress', 'recognition', 'streaks', 'records']
  },
  {
    id: 'ai-training-plan',
    title: 'AI Training Generator',
    category: 'Features',
    description: 'Generate a custom training plan with AI',
    url: '/training-plan?generate=true',
    icon: <Sparkles className="h-4 w-4" />,
    keywords: ['generate', 'custom', 'personalized', 'smart', 'adaptive', 'automatic', 'tailored', 'intelligent', 'plan', 'schedule']
  },
  {
    id: 'energy-calculator',
    title: 'Energy Level Calculator',
    category: 'Features',
    description: 'Calculate your daily readiness score',
    url: '/dashboard?widget=energy',
    icon: <Zap className="h-4 w-4" />,
    keywords: ['readiness', 'recovery', 'hrv', 'sleep', 'freshness', 'fatigue', 'strain', 'preparedness', 'wellness', 'rest']
  },
  {
    id: 'nutrition-ai',
    title: 'Nutrition Recommendations',
    category: 'Features',
    description: 'Get AI-powered food suggestions',
    url: '/nutrition?tab=recommendations',
    icon: <Utensils className="h-4 w-4" />,
    keywords: ['diet', 'meal plan', 'food', 'eating', 'recipes', 'macros', 'calories', 'suggestions', 'hydration', 'recovery']
  },
  {
    id: 'weight-tracking',
    title: 'Weight Tracking',
    category: 'Features',
    description: 'Monitor weight and body composition changes',
    url: '/health-metrics?metric=weight',
    icon: <Scale className="h-4 w-4" />,
    keywords: ['body', 'weight', 'bmi', 'composition', 'fat', 'mass', 'tracking', 'trend', 'history', 'log']
  },
  {
    id: 'coach-chat',
    title: 'Coach Messaging',
    category: 'Premium Features',
    description: 'Chat with your running coach (Annual subscription)',
    url: '/coaches?tab=messages',
    icon: <MessageCircle className="h-4 w-4" />,
    keywords: ['communication', 'chat', 'message', 'conversation', 'support', 'advice', 'guidance', 'questions', 'feedback']
  },
  {
    id: 'community',
    title: 'Community',
    category: 'Features',
    description: 'Connect with other runners',
    url: '/community',
    icon: <Users className="h-4 w-4" />,
    keywords: ['social', 'forum', 'chat', 'members', 'runners', 'athletes', 'groups', 'friends', 'teams', 'leaderboard']
  },
  {
    id: 'support',
    title: 'Support Chat',
    category: 'Help',
    description: 'Get help using the platform',
    url: '#support-chat',
    icon: <MessageCircle className="h-4 w-4" />,
    keywords: ['help', 'assistance', 'guide', 'chatbot', 'questions', 'issues', 'problems', 'information', 'faq', 'contact']
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    category: 'Help',
    description: 'Set up your account preferences',
    url: '/onboarding',
    icon: <AtSign className="h-4 w-4" />,
    keywords: ['start', 'setup', 'welcome', 'introduction', 'tutorial', 'guided', 'walkthrough', 'preferences', 'initial']
  }
];

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>(searchData);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!query) {
      setResults(searchData);
      return;
    }

    const queryLower = query.toLowerCase().trim();
    const queryTerms = queryLower.split(/\s+/);
    
    const filtered = searchData.filter(item => {
      const searchableText = [
        item.title.toLowerCase(),
        item.description.toLowerCase(),
        item.category.toLowerCase(),
        ...(item.keywords?.map(k => k.toLowerCase()) || [])
      ].join(' ');
      
      return queryTerms.every(term => searchableText.includes(term));
    });

    setResults(filtered);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    onOpenChange(false);
    setTimeout(() => setLocation(item.url), 10);
  };

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search the application</DialogDescription>
        </DialogHeader>
        <Command className="rounded-t-none border-none">
          <CommandInput 
            placeholder="Search for pages, features, or settings..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {Object.keys(groupedResults).length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            
            {Object.entries(groupedResults).map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map(item => (
                  <CommandItem 
                    key={item.id} 
                    onSelect={() => handleSelect(item)}
                    className="flex items-center"
                  >
                    <div className="mr-2 flex-shrink-0">{item.icon}</div>
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function SearchButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <Button 
        variant="outline" 
        className="relative w-full h-9 flex items-center justify-start px-3 gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4" />
        <span className="flex-grow text-left">Search...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}