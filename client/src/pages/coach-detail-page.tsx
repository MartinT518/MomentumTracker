import { useParams, Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { SubscriptionGate } from '@/components/common/subscription-gate';
import { Sidebar } from '@/components/common/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronLeft, Users, Clock, Trophy, UserCheck2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';

type Coach = {
  id: number;
  user_id: number;
  name: string;
  bio: string;
  specialty: string;
  experience_years: string;
  certifications: string;
  profile_image: string;
  hourly_rate: string;
  available: boolean;
};

type SessionType = 'Plan Review' | 'Form Analysis' | 'General Consultation' | 'Training Strategy';
type TimeSlot = {
  time: string;
  available: boolean;
};

export default function CoachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for booking a session
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [sessionType, setSessionType] = useState<SessionType | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  
  // Sample time slots (would be fetched from API based on coach availability)
  const timeSlots: TimeSlot[] = [
    { time: '9:00 AM', available: true },
    { time: '10:00 AM', available: true },
    { time: '11:00 AM', available: false },
    { time: '1:00 PM', available: true },
    { time: '2:00 PM', available: true },
    { time: '3:00 PM', available: false },
    { time: '4:00 PM', available: true },
  ];
  
  // Fetch coach details
  const { data: coach, isLoading, error } = useQuery({
    queryKey: ['/api/coaches', id],
    queryFn: async () => {
      const res = await fetch(`/api/coaches/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch coach details');
      }
      return res.json();
    },
  });
  
  // Create session and proceed to payment
  const bookSession = async () => {
    if (!date || !sessionType || !timeSlot) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Combine date and time for the session_date
      const [timeHours, minutes] = timeSlot.replace(' AM', '').replace(' PM', '').split(':').map(Number);
      let sessionDate = new Date(date);
      sessionDate.setHours(
        timeSlot.includes('PM') && timeHours !== 12 ? timeHours + 12 : timeHours,
        minutes
      );
      
      const sessionData = {
        coach_id: Number(id),
        session_date: sessionDate.toISOString(),
        duration_minutes: 45, // Default session length
        type: sessionType,
        notes: notes
      };
      
      // Create session with pending_payment status
      const response = await apiRequest('POST', '/api/coaching-sessions', sessionData);
      const newSession = await response.json();
      
      // Calculate session cost for display
      const hourlyRate = parseFloat(coach.hourly_rate);
      const sessionHours = 45 / 60; // 45 minutes
      const totalCost = (hourlyRate * sessionHours).toFixed(2);
      
      toast({
        title: "Session Created",
        description: `Session created. Total cost: $${totalCost}. Proceed to payment to confirm.`,
      });
      
      // Reset form and close booking dialog
      setDate(undefined);
      setSessionType(undefined);
      setTimeSlot(undefined);
      setNotes('');
      setBookingDialogOpen(false);
      
      // Show payment dialog or redirect to payment page
      // For now, show a toast with payment instructions
      toast({
        title: "Payment Required",
        description: `Visit your coaching sessions to complete payment for $${totalCost}`,
      });
      
      // Invalidate sessions query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/coaching-sessions'] });
      
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: `There was an error creating your session: ${error.message}`,
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded-md"></div>
            <div className="h-48 bg-muted rounded-md"></div>
            <div className="h-24 bg-muted rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !coach) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 space-y-4 p-8 pt-6 flex flex-col items-center justify-center">
          <h3 className="text-xl">Coach not found or an error occurred</h3>
          <p className="text-muted-foreground">We couldn't find the coach you're looking for.</p>
          <Button className="mt-4" asChild>
            <Link to="/coaches">Back to Coaches</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/coaches')}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Coach Profile</h2>
        </div>
        
        <SubscriptionGate 
          requiredSubscription="annual" 
          featureName="Human Coach" 
          icon={Users}
          description="Get personalized guidance from experienced running coaches. Available exclusively for annual subscribers."
        >
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Avatar className="h-28 w-28 border-2 border-primary/10">
                    <AvatarImage src={coach.profile_image} alt={coach.name} />
                    <AvatarFallback className="text-3xl">{coach.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-2xl font-bold">{coach.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30">{coach.specialty}</Badge>
                    <Badge variant="outline">{coach.experience_years} years exp.</Badge>
                    <Badge variant="secondary">${coach.hourly_rate}/hour</Badge>
                  </div>
                  <p className="text-muted-foreground mt-2">{coach.bio}</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center gap-4">
                  <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">Book a Session</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                      <DialogHeader>
                        <DialogTitle>Book a Session with {coach.name}</DialogTitle>
                        <DialogDescription>
                          Choose a date, time and session type to book your coaching session.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="session-type">Session Type</Label>
                          <Select value={sessionType} onValueChange={(value) => setSessionType(value as SessionType)}>
                            <SelectTrigger id="session-type">
                              <SelectValue placeholder="Select a session type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Plan Review">Plan Review</SelectItem>
                              <SelectItem value="Form Analysis">Form Analysis</SelectItem>
                              <SelectItem value="General Consultation">General Consultation</SelectItem>
                              <SelectItem value="Training Strategy">Training Strategy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {date ? format(date, "PPP") : "Select a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={date}
                                  onSelect={setDate}
                                  initialFocus
                                  disabled={(date) => {
                                    // Disable past dates and dates more than 3 months in the future
                                    const now = new Date();
                                    now.setHours(0, 0, 0, 0);
                                    const maxDate = new Date();
                                    maxDate.setMonth(maxDate.getMonth() + 3);
                                    return date < now || date > maxDate;
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="time-slot">Time Slot</Label>
                            <Select 
                              value={timeSlot} 
                              onValueChange={setTimeSlot}
                              disabled={!date}
                            >
                              <SelectTrigger id="time-slot">
                                <SelectValue placeholder="Select a time" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((slot) => (
                                  <SelectItem 
                                    key={slot.time} 
                                    value={slot.time}
                                    disabled={!slot.available}
                                  >
                                    {slot.time} {!slot.available && "(Unavailable)"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="notes">Notes (optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Let the coach know about specific areas you'd like to discuss"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
                        <Button onClick={bookSession}>Book Session</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="about">
            <TabsList className="w-full max-w-md">
              <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
              <TabsTrigger value="expertise" className="flex-1">Areas of Expertise</TabsTrigger>
              <TabsTrigger value="testimonials" className="flex-1">Testimonials</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Certifications & Qualifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {coach.certifications.split(',').map((cert, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span>{cert.trim()}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Coaching Approach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {coach.name} focuses on {coach.specialty.toLowerCase()} and takes a personalized approach to coaching. 
                    With {coach.experience_years} years of experience, they have developed effective methods for runners of all abilities.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Session Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Session Types</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start space-x-2">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h5 className="font-medium">Plan Review</h5>
                          <p className="text-sm text-muted-foreground">Review and adjust your current training plan</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h5 className="font-medium">Form Analysis</h5>
                          <p className="text-sm text-muted-foreground">Analysis of your running mechanics with feedback</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h5 className="font-medium">General Consultation</h5>
                          <p className="text-sm text-muted-foreground">Discuss any running or training questions</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <h5 className="font-medium">Training Strategy</h5>
                          <p className="text-sm text-muted-foreground">Strategic planning for races and events</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Session Details</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• All sessions are 45 minutes in length</li>
                      <li>• Conducted via video call</li>
                      <li>• Sessions can be recorded upon request</li>
                      <li>• Cancellation must be made at least 24 hours in advance</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="expertise" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Areas of Expertise</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        <UserCheck2 className="h-4 w-4 inline mr-2 text-primary" />
                        Specialization
                      </h4>
                      <p className="text-sm text-muted-foreground pl-6">
                        {coach.specialty} with {coach.experience_years} years of coaching experience
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        <UserCheck2 className="h-4 w-4 inline mr-2 text-primary" />
                        Race Distances
                      </h4>
                      <p className="text-sm text-muted-foreground pl-6">
                        5K, 10K, Half Marathon, Marathon, Ultra Distances
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        <UserCheck2 className="h-4 w-4 inline mr-2 text-primary" />
                        Training Methods
                      </h4>
                      <p className="text-sm text-muted-foreground pl-6">
                        Periodization, Heart Rate Training, Form Mechanics, Race Strategy
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        <UserCheck2 className="h-4 w-4 inline mr-2 text-primary" />
                        Runner Types
                      </h4>
                      <p className="text-sm text-muted-foreground pl-6">
                        Beginners, Intermediate, Advanced, Masters, Youth
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="testimonials" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Athlete Testimonials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-l-4 border-primary/30 pl-4 py-2">
                    <p className="italic text-muted-foreground mb-2">
                      "{coach.name} helped me shave 15 minutes off my marathon time through targeted training plans and technique adjustments. Their expertise in {coach.specialty.toLowerCase()} made all the difference."
                    </p>
                    <p className="text-sm font-medium">- Michael T., Marathon Runner</p>
                  </div>
                  
                  <div className="border-l-4 border-primary/30 pl-4 py-2">
                    <p className="italic text-muted-foreground mb-2">
                      "After struggling with injuries for years, {coach.name}'s coaching completely transformed my running. Their knowledge of biomechanics and recovery strategies helped me train consistently for the first time in my running career."
                    </p>
                    <p className="text-sm font-medium">- Samantha K., Trail Runner</p>
                  </div>
                  
                  <div className="border-l-4 border-primary/30 pl-4 py-2">
                    <p className="italic text-muted-foreground mb-2">
                      "Working with {coach.name} was the best investment I've made in my running. The personalized guidance and accountability helped me achieve goals I didn't think were possible."
                    </p>
                    <p className="text-sm font-medium">- David L., 5K Specialist</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </SubscriptionGate>
      </div>
    </div>
  );
}