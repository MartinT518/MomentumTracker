import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Coach } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Star, Award, Calendar } from 'lucide-react';

interface CoachSelectionProps {
  onCoachSelected: (coach: Coach, sessionId: string) => void;
  subscriptionActive: boolean;
}

export function CoachSelection({ onCoachSelected, subscriptionActive }: CoachSelectionProps) {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goals, setGoals] = useState('');
  const [questions, setQuestions] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get coaches
  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ['/api/coaches'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/coaches');
      return await response.json();
    },
    enabled: subscriptionActive, // Only fetch if user has active subscription
  });
  
  // Get existing coaching sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/coaching-sessions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/coaching-sessions');
      return await response.json();
    },
    enabled: subscriptionActive, // Only fetch if user has active subscription
  });
  
  // Mutation for creating a new coaching session
  const createSessionMutation = useMutation({
    mutationFn: async (data: { coach_id: number; goals: string; questions: string }) => {
      const response = await apiRequest('POST', '/api/coaching-sessions', data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaching-sessions'] });
      setDialogOpen(false);
      
      // Find the coach from our coaches list
      const coach = coaches.find((c: Coach) => c.id === data.coach_id);
      if (coach) {
        toast({
          title: "Coaching Session Created",
          description: `Your session with ${coach.name} has been set up. You can now start chatting!`,
        });
        
        // Notify parent component that a coach was selected
        onCoachSelected(coach, data.id.toString());
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create coaching session: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleCoachSelect = (coach: Coach) => {
    setSelectedCoach(coach);
    setDialogOpen(true);
  };
  
  const handleContinueWithSession = (coach: Coach, sessionId: string) => {
    onCoachSelected(coach, sessionId);
    toast({
      title: "Coaching Session Resumed",
      description: `You're now connected with ${coach.name}. Continue your conversation where you left off.`,
    });
  };
  
  const handleCreateSession = () => {
    if (!selectedCoach) return;
    
    createSessionMutation.mutate({
      coach_id: selectedCoach.id,
      goals,
      questions
    });
  };
  
  // Find existing session for a coach
  const findExistingSession = (coachId: number) => {
    return sessions.find((session: any) => 
      session.coach_id === coachId && session.status === 'active'
    );
  };
  
  // Content to show when user doesn't have an active subscription
  const SubscriptionRequired = () => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Premium Feature</CardTitle>
        <CardDescription>
          Access to human coaches is a premium feature
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Award className="h-12 w-12 mx-auto text-primary" />
            <h3 className="text-xl font-medium">Upgrade to Premium</h3>
            <p className="text-muted-foreground">
              Get personalized coaching from experienced runners with our premium subscription.
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <h4 className="font-medium mb-2">Premium coaching includes:</h4>
          <ul className="space-y-2">
            <li className="flex items-start">
              <div className="mr-2 h-5 w-5 text-primary flex-shrink-0">✓</div>
              <span>One-on-one guidance from certified coaches</span>
            </li>
            <li className="flex items-start">
              <div className="mr-2 h-5 w-5 text-primary flex-shrink-0">✓</div>
              <span>Personalized training plan adjustments</span>
            </li>
            <li className="flex items-start">
              <div className="mr-2 h-5 w-5 text-primary flex-shrink-0">✓</div>
              <span>Race-specific strategy and preparation</span>
            </li>
            <li className="flex items-start">
              <div className="mr-2 h-5 w-5 text-primary flex-shrink-0">✓</div>
              <span>Regular check-ins and feedback</span>
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <a href="/subscription">Upgrade Now</a>
        </Button>
      </CardFooter>
    </Card>
  );
  
  // If user doesn't have an active subscription, show upgrade prompt
  if (!subscriptionActive) {
    return <SubscriptionRequired />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Select a Coach</h2>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Coaches</TabsTrigger>
          <TabsTrigger value="my">My Coaches</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-32 bg-gray-200 rounded-t-lg"></CardHeader>
                  <CardContent className="space-y-4 py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-24 bg-gray-100 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coaches.map((coach: Coach) => {
                const existingSession = findExistingSession(coach.id);
                
                return (
                  <Card key={coach.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-2">
                      <div className="flex items-start">
                        <Avatar className="h-16 w-16 border-2 border-background">
                          <AvatarImage src={coach.profile_image || ''} />
                          <AvatarFallback>{coach.name?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3 space-y-1">
                          <CardTitle className="text-lg">{coach.name}</CardTitle>
                          <CardDescription>
                            {coach.specialty || 'Running Coach'}
                          </CardDescription>
                          <div className="flex items-center mt-1">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">
                              {(Math.random() * 2 + 3).toFixed(1)} 
                              <span className="text-muted-foreground font-normal ml-1">
                                ({Math.floor(Math.random() * 40 + 10)} reviews)
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4">
                      <div className="flex mb-3">
                        <Badge variant="outline" className="mr-2">
                          {Math.floor(Math.random() * 10 + 3)} yrs exp
                        </Badge>
                        <Badge variant="outline">
                          {coach.available ? 'Available' : 'Limited Availability'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm line-clamp-3 mb-3">
                        {coach.bio || `${coach.name} is an experienced running coach specializing in ${coach.specialty || 'distance running'}. With a proven track record of helping athletes achieve their goals.`}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Specialties:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {(coach.specialty?.split(',') || ['Marathon', 'Half Marathon', '5K/10K']).map((specialty, i) => (
                            <Badge key={i} variant="secondary" className="font-normal">
                              {specialty.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {coach.certifications && (
                        <div className="mt-3 space-y-2">
                          <div className="text-sm font-medium">Certifications:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {coach.certifications.split(',').map((cert, i) => (
                              <Badge key={i} variant="outline" className="font-normal">
                                {cert.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="bg-gray-50 dark:bg-gray-900/50 border-t flex justify-between">
                      {existingSession ? (
                        <Button 
                          className="w-full"
                          onClick={() => handleContinueWithSession(coach, existingSession.id.toString())}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Continue Session
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => handleCoachSelect(coach)}
                        >
                          Start Coaching
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my">
          {sessions.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">No Active Coaching Sessions</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any active coaching sessions. Select a coach to get started.
              </p>
              <Button variant="outline" onClick={() => document.querySelector('[data-value="all"]')?.click()}>
                Browse Coaches
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session: any) => {
                const coach = coaches.find((c: Coach) => c.id === session.coach_id);
                if (!coach) return null;
                
                return (
                  <Card key={session.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={coach.profile_image || ''} />
                          <AvatarFallback>{coach.name?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <CardTitle className="text-base">{coach.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(session.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-3 pb-4">
                      {session.goals && (
                        <div className="mb-3">
                          <div className="text-sm font-medium mb-1">Goals:</div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{session.goals}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Session Status:</span>
                        <Badge>{session.status}</Badge>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t bg-muted/30">
                      <Button 
                        className="w-full"
                        onClick={() => handleContinueWithSession(coach, session.id.toString())}
                      >
                        Continue Session
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Session Creation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start Coaching with {selectedCoach?.name}</DialogTitle>
            <DialogDescription>
              Share your training goals and questions to help your coach provide personalized guidance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goals">What are your training goals?</Label>
              <Textarea
                id="goals"
                placeholder="Example: I'm training for my first marathon in October. My goal is to finish under 4 hours."
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="questions">Any specific questions or concerns?</Label>
              <Textarea
                id="questions"
                placeholder="Example: I'm struggling with long runs over 15 miles and experiencing some knee pain."
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateSession} 
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? "Creating..." : "Start Coaching"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}