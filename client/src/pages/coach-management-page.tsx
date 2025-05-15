import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, Users } from 'lucide-react';
import Sidebar from '@/components/common/sidebar';
import MobileMenu from '@/components/common/mobile-menu';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Switch } from '@/components/ui/switch';

// Form validation schema
const coachFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  bio: z.string().min(10, { message: "Bio must be at least 10 characters" }),
  specialty: z.string().min(2, { message: "Specialty must be at least 2 characters" }),
  experience_years: z.string().min(1, { message: "Experience is required" }),
  certifications: z.string().optional(),
  profile_image: z.string().url({ message: "Please enter a valid URL" }).optional(),
  hourly_rate: z.string().min(1, { message: "Hourly rate is required" }),
  available: z.boolean().default(true)
});

type CoachFormValues = z.infer<typeof coachFormSchema>;

export default function CoachManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  // Query to fetch existing coaches
  const { data: coaches, isLoading: isLoadingCoaches } = useQuery({
    queryKey: ['/api/coaches/all'],
    enabled: !!user,
  });

  // Form definition
  const form = useForm<CoachFormValues>({
    resolver: zodResolver(coachFormSchema),
    defaultValues: {
      name: '',
      bio: '',
      specialty: '',
      experience_years: '',
      certifications: '',
      profile_image: '',
      hourly_rate: '',
      available: true
    }
  });

  // Mutation to add a new coach
  const addCoachMutation = useMutation({
    mutationFn: async (data: CoachFormValues) => {
      const response = await apiRequest('POST', '/api/coaches', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Coach added successfully",
        description: "The new coach has been added to the platform.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/coaches/all'] });
      form.reset();
      setIsAdding(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add coach",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: CoachFormValues) => {
    addCoachMutation.mutate(data);
  };

  // If user is not authenticated, show unauthorized message
  if (!user) {
    return (
      <div className="flex h-screen max-w-full overflow-hidden">
        <Sidebar />
        <MobileMenu />
        <div className="flex-1 p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-2xl font-bold mb-4">Unauthorized</h2>
            <p className="text-neutral-dark">Please log in to access coach management.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Coach Management</h1>
            <Button 
              onClick={() => setIsAdding(!isAdding)} 
              className="flex items-center gap-2"
            >
              {isAdding ? 'Cancel' : (
                <>
                  <UserPlus size={16} />
                  Add New Coach
                </>
              )}
            </Button>
          </div>

          {isAdding && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Add New Coach</CardTitle>
                <CardDescription>
                  Fill out the form below to add a new coach to the platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Coach's full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="specialty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialty</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Marathon Training, Speed Development" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Coach's background, achievements, and coaching philosophy" 
                              className="min-h-32" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="experience_years"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hourly_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Rate ($)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="75" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="certifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certifications</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. USATF Level 2, RRCA Certified Coach" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="profile_image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="available"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Available for Coaching</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Coach will be shown as available for booking sessions
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={addCoachMutation.isPending}
                    >
                      {addCoachMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding Coach...
                        </>
                      ) : 'Add Coach'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div className="mt-8">
            <Card>
              <CardHeader className="flex flex-row items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={20} />
                    Current Coaches
                  </CardTitle>
                  <CardDescription>
                    Manage the coaches currently on the platform
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCoaches ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : coaches && coaches.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {coaches.map((coach: any) => (
                      <Card key={coach.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          {coach.profile_image && (
                            <div className="w-full md:w-1/4">
                              <img 
                                src={coach.profile_image} 
                                alt={coach.name} 
                                className="h-48 md:h-full w-full object-cover" 
                              />
                            </div>
                          )}
                          <div className="flex-1 p-4">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                              <div>
                                <h3 className="text-xl font-bold">{coach.name}</h3>
                                <p className="text-sm text-muted-foreground">{coach.specialty}</p>
                                <p className="mt-2 line-clamp-3">{coach.bio}</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                                    {coach.experience_years} Years Exp.
                                  </div>
                                  <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                                    ${coach.hourly_rate}/hour
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-xs ${coach.available 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'}`}>
                                    {coach.available ? 'Available' : 'Unavailable'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 mt-4 md:mt-0">
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm">
                                  Toggle Availability
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">No Coaches Found</h3>
                    <p className="text-muted-foreground">Add your first coach using the form above.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}