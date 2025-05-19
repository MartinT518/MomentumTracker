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
    keywords: ['runs', 'workouts', 'history', 'log', 'record', 'strava', 'garmin', 'polar', 'sync'],
  },
  {
    id: 'goals',
    title: 'Goals',
    category: 'Pages',
    description: 'Set and track your running goals',
    url: '/goals',
    icon: <Sparkles className="h-4 w-4" />,
    keywords: ['targets', 'objectives', 'aims', 'race', 'event', 'progress', 'achievement'],
  },
  {
    id: 'profile',
    title: 'Profile',
    category: 'Pages',
    description: 'Manage your user profile and preferences',
    url: '/profile',
    icon: <UserCircle className="h-4 w-4" />,
    keywords: ['account', 'user', 'personal', 'details', 'information', 'edit profile'],
  },
  {
    id: 'settings',
    title: 'Settings',
    category: 'Pages',
    description: 'Configure app settings and integrations',
    url: '/settings',
    icon: <Settings className="h-4 w-4" />,
    keywords: ['configuration', 'preferences', 'options', 'setup', 'connection', 'strava', 'garmin', 'polar', 'training preferences'],
  },
  {
    id: 'subscription',
    title: 'Subscription',
    category: 'Pages',
    description: 'Manage your premium subscription',
    url: '/subscription',
    icon: <CreditCard className="h-4 w-4" />,
    keywords: ['premium', 'payment', 'plan', 'upgrade', 'billing', 'monthly', 'annual', 'cancel', 'change plan'],
  },
  {
    id: 'strength-exercises',
    title: 'Strength Training',
    category: 'Pages',
    description: 'View and track strength exercises',
    url: '/strength-exercises',
    icon: <Dumbbell className="h-4 w-4" />,
    keywords: ['strength', 'workout', 'exercises', 'gym', 'weights', 'cross-training', 'resistance'],
  },
  {
    id: 'health-metrics',
    title: 'Health Metrics',
    category: 'Pages',
    description: 'Track your health data and biometrics',
    url: '/health-metrics',
    icon: <Heart className="h-4 w-4" />,
    keywords: ['hrv', 'sleep', 'recovery', 'resting heart rate', 'weight', 'health', 'biometrics', 'energy', 'readiness'],
  },
  {
    id: 'nutrition',
    title: 'Nutrition',
    category: 'Pages',
    description: 'Track meals and manage your nutrition plan',
    url: '/nutrition',
    icon: <Apple className="h-4 w-4" />,
    keywords: ['food', 'diet', 'meals', 'calories', 'nutrients', 'eating', 'hydration', 'recipes', 'meal plan'],
  },
  {
    id: 'coaches',
    title: 'Human Coaches',
    category: 'Pages',
    description: 'Connect with human coaches (Annual Subscription)',
    url: '/coaches',
    icon: <UserCircle className="h-4 w-4" />,
    keywords: ['coach', 'human', 'trainer', 'annual', 'premium', 'expert', 'guidance', 'help'],
  },
  {
    id: 'video-analysis',
    title: 'Video Analysis',
    category: 'Pages',
    description: 'Get running form analysis (Annual Subscription)',
    url: '/video-analysis',
    icon: <Sparkles className="h-4 w-4" />,
    keywords: ['video', 'form', 'analysis', 'technique', 'annual', 'premium', 'running form', 'improvement'],
  },
  // Features
  {
    id: 'connect-device',
    title: 'Connect Fitness Device',
    category: 'Features',
    description: 'Connect Strava, Garmin, or Polar devices',
    url: '/settings',
    icon: <Settings className="h-4 w-4" />,
    keywords: ['strava', 'garmin', 'polar', 'connect', 'sync', 'integration', 'fitness tracker'],
  },
  {
    id: 'generate-plan',
    title: 'Generate Training Plan',
    category: 'Features',
    description: 'Create a new AI-powered training plan',
    url: '/training-plan?tab=ai-plan',
    icon: <Sparkles className="h-4 w-4" />,
    keywords: ['ai', 'create', 'plan', 'training', 'generate', 'personalized', 'workout schedule'],
  },
  {
    id: 'upgrade',
    title: 'Upgrade to Premium',
    category: 'Features',
    description: 'Get access to premium features',
    url: '/subscription',
    icon: <CreditCard className="h-4 w-4" />,
    keywords: ['premium', 'upgrade', 'subscription', 'payment', 'features', 'monthly', 'annual'],
  },
  {
    id: 'training-preferences',
    title: 'Training Preferences',
    category: 'Settings',
    description: 'Update your training preferences and schedule',
    url: '/settings?tab=training',
    icon: <Settings className="h-4 w-4" />,
    keywords: ['training', 'preferences', 'schedule', 'rest days', 'zones', 'long run', 'workout time'],
  },
  {
    id: 'import-activity',
    title: 'Import Activities',
    category: 'Features',
    description: 'Manually import or sync activities',
    url: '/activities?action=import',
    icon: <Clock className="h-4 w-4" />,
    keywords: ['import', 'sync', 'upload', 'activities', 'strava', 'garmin', 'polar', 'manual'],
  },
  {
    id: 'energy-calculator',
    title: 'Energy Level Calculator',
    category: 'Features',
    description: 'Check your daily energy and readiness',
    url: '/health-metrics?tab=energy',
    icon: <Heart className="h-4 w-4" />,
    keywords: ['energy', 'readiness', 'recovery', 'hrv', 'sleep', 'calculator', 'daily'],
  },
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
    const queryTerms = queryLower.split(/\s+/); // Split by whitespace to search for multiple terms
    
    const filtered = searchData.filter(item => {
      // Create an array of all searchable content, lowercased
      const itemSearchContent = [
        item.title.toLowerCase(),
        item.description.toLowerCase(),
        item.category.toLowerCase(),
        ...(item.keywords?.map(keyword => keyword.toLowerCase()) || [])
      ];
      
      // Join all content into a single string for more comprehensive matching
      const fullSearchText = itemSearchContent.join(' ');
      
      // Item matches if ALL query terms are found in any of the searchable content
      return queryTerms.every(term => fullSearchText.includes(term));
    });

    setResults(filtered);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    // Close the dialog first
    onOpenChange(false);
    
    // Short delay to ensure dialog closes before navigation
    setTimeout(() => {
      // Use the wouter location hook for navigation
      setLocation(item.url);
    }, 10);
  };

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="overflow-hidden p-0 max-w-[90vw] md:max-w-[60vw] md:w-[550px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Search AetherRun</DialogTitle>
          <DialogDescription>
            Type to search for pages, features, or training resources
          </DialogDescription>
        </DialogHeader>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
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