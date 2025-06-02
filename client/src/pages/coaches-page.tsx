import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { SubscriptionGate } from '@/components/common/subscription-gate';
import { AppLayout } from '@/components/common/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Calendar, User2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

type Coach = {
  id: number;
  user_id: number;
  name: string;
  bio: string;
  specialty: string;
  experience_years: number;
  certifications: string;
  profile_image: string;
  hourly_rate: number;
  available: boolean;
};

type CoachingSession = {
  id: number;
  coach_id: number;
  athlete_id: number;
  session_date: string;
  duration_minutes: number;
  type: string;
  status: string;
  notes: string;
  recording_url?: string;
};

export default function CoachesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch coaches
  const { data: coaches, isLoading: isLoadingCoaches } = useQuery({
    queryKey: ['/api/coaches'],
    queryFn: async () => {
      const res = await fetch('/api/coaches');
      if (!res.ok) {
        if (res.status === 403) {
          // This will be caught by the SubscriptionGate component
          return [];
        }
        throw new Error('Failed to fetch coaches');
      }
      return res.json();
    },
    retry: (failureCount, error: any) => {
      // Don't retry if we got a 403 (subscription required)
      if (error?.response?.status === 403) return false;
      return failureCount < 3;
    },
  });
  
  // Fetch user's coaching sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/coaching-sessions'],
    queryFn: async () => {
      const res = await fetch(`/api/coaching-sessions?athlete_id=${user?.id}`);
      if (!res.ok) {
        if (res.status === 403) {
          // This will be caught by the SubscriptionGate component
          return [];
        }
        throw new Error('Failed to fetch coaching sessions');
      }
      return res.json();
    },
    enabled: !!user?.id,
    retry: (failureCount, error: any) => {
      // Don't retry if we got a 403 (subscription required)
      if (error?.response?.status === 403) return false;
      return failureCount < 3;
    },
  });

  // Component to display when loading
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="space-y-2">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-white/20"></div>
              <div>
                <div className="h-4 bg-white/20 rounded-md w-24"></div>
                <div className="h-3 bg-white/20 rounded-md w-16 mt-2"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-white/20 rounded-md w-full mb-2"></div>
            <div className="h-4 bg-white/20 rounded-md w-5/6"></div>
          </CardContent>
          <CardFooter>
            <div className="h-9 bg-white/20 rounded-md w-full"></div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  // The coaches list content
  const CoachesList = () => {
    if (isLoadingCoaches) {
      return <LoadingSkeleton />;
    }
    
    if (!coaches?.length) {
      return (
        <Card className="col-span-full p-6 text-center bg-white/10 backdrop-blur-sm border-white/20">
          <p className="text-white/70 drop-shadow-sm">No coaches available at the moment. Check back soon!</p>
        </Card>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coaches.map((coach: Coach) => (
          <Card key={coach.id} className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={coach.profile_image} alt={coach.name} />
                  <AvatarFallback className="bg-white/20 text-white">{coach.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg text-white drop-shadow-sm">{coach.name}</CardTitle>
                  <CardDescription className="text-white/80 drop-shadow-sm">{coach.specialty}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm text-white/70 drop-shadow-sm">{coach.bio}</p>
              <div className="flex items-center space-x-2 mt-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">{coach.experience_years} years exp.</Badge>
                <Badge variant="outline" className="border-white/30 text-white/80">
                  ${coach.hourly_rate}/hour
                </Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Link to={`/coaches/${coach.id}`}>View Profile</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  // The sessions list content
  const SessionsList = () => {
    if (isLoadingSessions) {
      return <LoadingSkeleton />;
    }
    
    if (!sessions?.length) {
      return (
        <Card className="col-span-full p-6 text-center">
          <p className="text-muted-foreground">You don't have any coaching sessions scheduled yet.</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link to="/coaches">Find a Coach</Link>
          </Button>
        </Card>
      );
    }
    
    // Group sessions by status
    const upcomingSessions = sessions.filter((s: CoachingSession) => 
      ['scheduled', 'confirmed'].includes(s.status.toLowerCase())
    );
    
    const pastSessions = sessions.filter((s: CoachingSession) => 
      ['completed', 'cancelled'].includes(s.status.toLowerCase())
    );
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Upcoming Sessions</h3>
        {upcomingSessions.length === 0 ? (
          <p className="text-muted-foreground">No upcoming sessions scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingSessions.map((session: CoachingSession) => {
              const coach = coaches?.find((c: Coach) => c.id === session.coach_id);
              return (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{session.type} Session</CardTitle>
                      <Badge>{session.status}</Badge>
                    </div>
                    <CardDescription>
                      {format(new Date(session.session_date), 'MMMM d, yyyy - h:mm a')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <User2 className="h-4 w-4 text-muted-foreground" />
                      <span>{coach?.name || 'Coach'}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{session.duration_minutes} minutes</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                    <Button variant="destructive" size="sm">
                      Cancel
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
        
        {pastSessions.length > 0 && (
          <>
            <Separator />
            <h3 className="text-lg font-medium mt-6">Past Sessions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastSessions.slice(0, 4).map((session: CoachingSession) => {
                const coach = coaches?.find((c: Coach) => c.id === session.coach_id);
                return (
                  <Card key={session.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{session.type} Session</CardTitle>
                        <Badge variant={session.status === 'completed' ? 'default' : 'destructive'}>
                          {session.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {format(new Date(session.session_date), 'MMMM d, yyyy')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-2">
                        <User2 className="h-4 w-4 text-muted-foreground" />
                        <span>{coach?.name || 'Coach'}</span>
                      </div>
                      {session.recording_url && (
                        <Button variant="link" className="p-0 h-auto mt-2" asChild>
                          <a href={session.recording_url} target="_blank" rel="noopener noreferrer">
                            View Recording
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {pastSessions.length > 4 && (
              <div className="text-center mt-4">
                <Button variant="outline">View All Past Sessions</Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                Coaching
              </h1>
              <p className="text-white/80 text-lg drop-shadow-md">
                Get personalized guidance from experienced running coaches
              </p>
            </div>
          </div>
        </div>
        
        {/* This is the key component that gates the feature based on subscription */}
        <SubscriptionGate 
          requiredSubscription="annual" 
          featureName="Human Coach" 
          icon={Users}
          description="Get personalized guidance from experienced running coaches. Available exclusively for annual subscribers."
        >
          <Tabs defaultValue="coaches">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl">
              <TabsTrigger value="coaches" className="flex items-center text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <Users className="mr-2 h-4 w-4" />
                Coaches
              </TabsTrigger>
              <TabsTrigger value="my-sessions" className="flex items-center text-white/70 data-[state=active]:bg-white/20 data-[state=active]:text-white hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <Calendar className="mr-2 h-4 w-4" />
                My Sessions
              </TabsTrigger>
            </TabsList>
            <TabsContent value="coaches" className="mt-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
                <CoachesList />
              </div>
            </TabsContent>
            <TabsContent value="my-sessions" className="mt-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-xl">
                <SessionsList />
              </div>
            </TabsContent>
          </Tabs>
        </SubscriptionGate>
      </div>
    </AppLayout>
  );
}