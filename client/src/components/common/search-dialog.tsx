import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Command, 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator
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
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  keywords?: string[];
}

const searchData: SearchResult[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    category: 'Pages',
    description: 'Overview of your running performance and upcoming workouts',
    url: '/dashboard',
    icon: <BarChart className="h-4 w-4" />,
    keywords: ['home', 'overview', 'main', 'stats', 'summary'],
  },
  {
    id: 'coach',
    title: 'Personal Coach',
    category: 'Features',
    description: 'Chat with your AI running coach or get human coaching',
    url: '/training-plan?tab=coach',
    icon: <Sparkles className="h-4 w-4" />,
    keywords: ['coach', 'coaching', 'advice', 'trainer', 'guidance', 'feedback', 'human coach', 'personal trainer'],
  },
  {
    id: 'training-plan',
    title: 'Training Plan',
    category: 'Pages',
    description: 'View and manage your training plans',
    url: '/training-plan',
    icon: <CalendarDays className="h-4 w-4" />,
    keywords: ['workout', 'schedule', 'training', 'run', 'plan', 'calendar'],
  },
  {
    id: 'activities',
    title: 'Activities',
    category: 'Pages',
    description: 'View your running activities and upload new ones',
    url: '/activities',
    icon: <Clock className="h-4 w-4" />,
    keywords: ['runs', 'workouts', 'history', 'log', 'record'],
  },
  {
    id: 'goals',
    title: 'Goals',
    category: 'Pages',
    description: 'Set and track your running goals',
    url: '/goals',
    icon: <Sparkles className="h-4 w-4" />,
    keywords: ['targets', 'objectives', 'aims', 'race', 'event'],
  },
  {
    id: 'profile',
    title: 'Profile',
    category: 'Pages',
    description: 'Manage your user profile and preferences',
    url: '/profile',
    icon: <UserCircle className="h-4 w-4" />,
    keywords: ['account', 'user', 'personal', 'details', 'information'],
  },
  {
    id: 'settings',
    title: 'Settings',
    category: 'Pages',
    description: 'Configure app settings and integrations',
    url: '/settings',
    icon: <Settings className="h-4 w-4" />,
    keywords: ['configuration', 'preferences', 'options', 'setup', 'connection'],
  },
  {
    id: 'subscription',
    title: 'Subscription',
    category: 'Pages',
    description: 'Manage your premium subscription',
    url: '/subscription',
    icon: <CreditCard className="h-4 w-4" />,
    keywords: ['premium', 'payment', 'plan', 'upgrade', 'billing'],
  },
  {
    id: 'strength-exercises',
    title: 'Strength Training',
    category: 'Pages',
    description: 'View and track strength exercises',
    url: '/strength-exercises',
    icon: <Dumbbell className="h-4 w-4" />,
    keywords: ['strength', 'workout', 'exercises', 'gym', 'weights', 'cross-training'],
  },
  {
    id: 'health-metrics',
    title: 'Health Metrics',
    category: 'Pages',
    description: 'Track your health data and biometrics',
    url: '/health-metrics',
    icon: <Heart className="h-4 w-4" />,
    keywords: ['hrv', 'sleep', 'recovery', 'resting heart rate', 'weight', 'health'],
  },
  {
    id: 'nutrition',
    title: 'Nutrition',
    category: 'Pages',
    description: 'Track meals and manage your nutrition plan',
    url: '/nutrition',
    icon: <Apple className="h-4 w-4" />,
    keywords: ['food', 'diet', 'meals', 'calories', 'nutrients', 'eating'],
  },
  // Features
  {
    id: 'connect-device',
    title: 'Connect Fitness Device',
    category: 'Features',
    description: 'Connect Strava, Garmin, or Polar devices',
    url: '/settings',
    icon: <Settings className="h-4 w-4" />,
    keywords: ['strava', 'garmin', 'polar', 'connect', 'sync', 'integration'],
  },
  {
    id: 'generate-plan',
    title: 'Generate Training Plan',
    category: 'Features',
    description: 'Create a new AI-powered training plan',
    url: '/training-plan?tab=ai-plan',
    icon: <Sparkles className="h-4 w-4" />,
    keywords: ['ai', 'create', 'plan', 'training', 'generate', 'personalized'],
  },
  {
    id: 'upgrade',
    title: 'Upgrade to Premium',
    category: 'Features',
    description: 'Get access to premium features',
    url: '/subscription',
    icon: <CreditCard className="h-4 w-4" />,
    keywords: ['premium', 'upgrade', 'subscription', 'payment', 'features'],
  },
];

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>(searchData);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!query) {
      setResults(searchData);
      return;
    }

    const filtered = searchData.filter(item => {
      const searchTerms = [
        item.title,
        item.description,
        item.category,
        ...(item.keywords || [])
      ].map(term => term.toLowerCase());
      
      return searchTerms.some(term => term.includes(query.toLowerCase()));
    });

    setResults(filtered);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    navigate(item.url);
    onOpenChange(false);
  };

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={onOpenChange}
      // Add an accessible title and description
      aria-labelledby="search-dialog-title" 
      aria-describedby="search-dialog-description"
    >
      <div id="search-dialog-title" className="sr-only">Search MomentumRun</div>
      <div id="search-dialog-description" className="sr-only">
        Type to search for pages, features, or training resources
      </div>
      <CommandInput 
        placeholder="Search for pages, features, or settings..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
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
    </CommandDialog>
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
        className="relative h-9 w-9 sm:h-9 sm:w-full sm:justify-start sm:px-3 sm:py-2"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-flex">Search</span>
        <span className="sr-only sm:not-sr-only">Search</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}