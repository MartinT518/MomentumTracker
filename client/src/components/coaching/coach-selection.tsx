import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Coach } from '@shared/schema';

interface CoachSelectionProps {
  coaches: Coach[];
  onCoachSelected: (coach: Coach, sessionId: string) => void;
}

export function CoachSelection({ coaches, onCoachSelected }: CoachSelectionProps) {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [goals, setGoals] = useState('');
  const [questions, setQuestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleCoachClick = (coach: Coach) => {
    setSelectedCoach(coach);
  };
  
  const handleRequestSession = async () => {
    if (!selectedCoach) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest('POST', '/api/coaching-sessions', {
        coach_id: selectedCoach.id,
        goals,
        questions
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create coaching session");
      }
      
      const session = await response.json();
      
      toast({
        title: "Session Created",
        description: `Your coaching session with ${selectedCoach.name} has been created`,
      });
      
      // Invalidate coaching sessions cache
      queryClient.invalidateQueries({ queryKey: ['/api/coaching-sessions'] });
      
      // Notify parent component
      onCoachSelected(selectedCoach, session.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderRating = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <StarIcon
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ));
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select a Coach</h2>
      <p className="text-muted-foreground">
        Premium subscribers have access to professional coaches who can provide personalized guidance and adjust your training plan
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coaches.map((coach) => (
          <Card 
            key={coach.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedCoach?.id === coach.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleCoachClick(coach)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={coach.profile_image || ''} />
                    <AvatarFallback>{coach.name?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{coach.name}</CardTitle>
                    <CardDescription>{coach.specialty || 'Running Coach'}</CardDescription>
                  </div>
                </div>
                {coach.is_available && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                    Available
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex mb-2">
                {renderRating(coach.rating || 4.5)}
                <span className="text-sm ml-1 text-muted-foreground">
                  ({coach.review_count || 24})
                </span>
              </div>
              <p className="text-sm line-clamp-3">{coach.bio || 'Experienced running coach specializing in marathon training and form improvement.'}</p>
            </CardContent>
            <CardFooter className="pt-0 flex justify-between items-center">
              <div className="text-sm font-medium">
                <span className="text-muted-foreground mr-1">Experience:</span>
                {coach.years_of_experience || '8'} years
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">View Profile</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>{coach.name}</DialogTitle>
                    <DialogDescription>{coach.specialty || 'Running Coach'}</DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={coach.profile_image || ''} />
                        <AvatarFallback>{coach.name?.[0]?.toUpperCase() || 'C'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex mb-1">
                          {renderRating(coach.rating || 4.5)}
                          <span className="text-sm ml-1 text-muted-foreground">
                            ({coach.review_count || 24})
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground mr-1">Experience:</span>
                          {coach.years_of_experience || '8'} years
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">About</h4>
                      <p className="text-sm">{coach.bio || 'Experienced running coach specializing in marathon training and form improvement. With 8 years of coaching experience, I help runners of all levels achieve their goals by providing personalized training plans and detailed form analysis. My training philosophy focuses on sustainable progress, injury prevention, and enjoyment of the sport.'}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {(coach.specialties || ['Marathon', 'Form Correction', 'Injury Prevention', 'Race Strategy']).map((specialty, i) => (
                          <Badge key={i} variant="secondary">{specialty}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Certifications</h4>
                      <ul className="text-sm list-disc pl-5 space-y-1">
                        {(coach.certifications || [
                          'USATF Level 2 Endurance Coach',
                          'RRCA Certified Running Coach',
                          'NASM Certified Personal Trainer',
                          'First Aid & CPR Certified'
                        ]).map((cert, i) => (
                          <li key={i}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button 
            disabled={!selectedCoach} 
            className="mt-4"
          >
            Request Coaching Session
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>New Coaching Session</DialogTitle>
            <DialogDescription>
              Share your goals and questions with {selectedCoach?.name || 'your coach'} to get started
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goals">Your Goals</Label>
              <Textarea
                id="goals"
                placeholder="What are your running goals? E.g., Finish a marathon, improve my 5K time, etc."
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="questions">Questions or Concerns</Label>
              <Textarea
                id="questions"
                placeholder="What specific questions do you have for your coach? E.g., How should I handle hills during my long runs?"
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleRequestSession} 
              disabled={isSubmitting || !goals.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Start Coaching Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}