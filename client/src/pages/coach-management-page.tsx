import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, Users } from 'lucide-react';
import { Sidebar } from '@/components/common/sidebar';
import { MobileMenu } from '@/components/common/mobile-menu';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Zod schema for coach form validation
const coachFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  bio: z.string().min(10, { message: "Bio must be at least 10 characters." }),
  specialties: z.string().min(5, { message: "Specialties must be at least 5 characters." }),
  certifications: z.string().min(5, { message: "Certifications must be at least 5 characters." }),
  experience_years: z.string().regex(/^\d+$/, { message: "Must be a number." }),
  photoUrl: z.string().url({ message: "Please enter a valid URL." }).optional(),
  isActive: z.boolean().default(true),
  hourlyRate: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Please enter a valid price." }),
});

type CoachFormValues = z.infer<typeof coachFormSchema>;

export default function CoachManagementPage() {
  const [editingCoachId, setEditingCoachId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Initialize form with default values
  const form = useForm<CoachFormValues>({
    resolver: zodResolver(coachFormSchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      bio: "",
      specialties: "",
      certifications: "",
      experience_years: "",
      photoUrl: "",
      isActive: true,
      hourlyRate: "",
    },
  });

  // Coach type definition
  type Coach = {
    id: number;
    name: string;
    email?: string;
    title: string;
    bio: string;
    specialties: string;
    certifications: string;
    experience_years: number;
    photo_url?: string;
    status: string;
    hourly_rate: number;
  };

  // Fetch all coaches
  const { data: coaches = [], isLoading } = useQuery<Coach[]>({
    queryKey: ['/api/coaches/all'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/coaches/all');
      return res.json();
    },
  });

  // Create coach mutation
  const createCoachMutation = useMutation({
    mutationFn: async (data: CoachFormValues) => {
      const res = await apiRequest('POST', '/api/coaches', {
        ...data,
        experience_years: parseInt(data.experience_years),
        hourlyRate: parseFloat(data.hourlyRate),
        status: data.isActive ? 'active' : 'inactive',
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coach created successfully!",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/coaches/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create coach",
        variant: "destructive",
      });
    },
  });

  // Update coach mutation
  const updateCoachMutation = useMutation({
    mutationFn: async (data: CoachFormValues & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest('PUT', `/api/coaches/${id}`, {
        ...rest,
        experience_years: rest.experience_years, // Keep as string as per DB schema
        hourlyRate: rest.hourlyRate,
        status: rest.isActive ? 'active' : 'inactive',
        specialties: rest.specialties, // Keep consistent with form field name
        photo_url: rest.photoUrl, // Match field name with server expectations
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coach updated successfully!",
      });
      form.reset();
      setEditingCoachId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/coaches/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update coach",
        variant: "destructive",
      });
    },
  });

  // Delete coach mutation
  const deleteCoachMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/coaches/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coach deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/coaches/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete coach",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: CoachFormValues) => {
    if (editingCoachId) {
      updateCoachMutation.mutate({ ...data, id: editingCoachId });
    } else {
      createCoachMutation.mutate(data);
    }
  };

  // Load coach data for editing
  const handleEditCoach = (coach: any) => {
    form.reset({
      name: coach.name,
      email: coach.email || '',
      title: coach.title,
      bio: coach.bio,
      specialties: coach.specialties,
      certifications: coach.certifications,
      experience_years: coach.experience_years.toString(),
      photoUrl: coach.photo_url || '',
      isActive: coach.status === 'active',
      hourlyRate: coach.hourly_rate.toString(),
    });
    setEditingCoachId(coach.id);
    window.scrollTo(0, 0);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    form.reset();
    setEditingCoachId(null);
  };

  // Check if user is an admin - currently just simulating this check
  // In a real application, this would be a proper role check
  const isAdmin = user?.id === 1; // This is just a placeholder check

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
        <MobileMenu />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 md:p-10 lg:pt-6">
            <div className="text-center py-20">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 max-w-md mx-auto">
                <h1 className="text-3xl font-bold mb-4 text-white drop-shadow-sm">Access Denied</h1>
                <p className="text-white/80 drop-shadow-sm">
                  You don't have permission to access this page.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
      <MobileMenu />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 lg:pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-sm">Coach Management</h1>
              <p className="text-white/70 drop-shadow-sm">Add, edit or remove coaches from the platform</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coach Form */}
            <Card className="lg:col-span-1 bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white drop-shadow-sm">{editingCoachId ? "Edit Coach" : "Add New Coach"}</CardTitle>
                <CardDescription className="text-white/70 drop-shadow-sm">
                  {editingCoachId 
                    ? "Update coach information" 
                    : "Fill in the details to add a new coach"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white drop-shadow-sm">Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Coach's full name" className="bg-white/10 border-white/30 text-white placeholder:text-white/60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white drop-shadow-sm">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="coach@example.com" className="bg-white/10 border-white/30 text-white placeholder:text-white/60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white drop-shadow-sm">Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Senior Running Coach" className="bg-white/10 border-white/30 text-white placeholder:text-white/60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="experience_years"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white drop-shadow-sm">Years of Experience</FormLabel>
                            <FormControl>
                              <Input placeholder="5" className="bg-white/10 border-white/30 text-white placeholder:text-white/60" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white drop-shadow-sm">Hourly Rate ($)</FormLabel>
                            <FormControl>
                              <Input placeholder="75.00" className="bg-white/10 border-white/30 text-white placeholder:text-white/60" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="specialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white drop-shadow-sm">Specialties</FormLabel>
                          <FormControl>
                            <Input placeholder="Marathon, Trail Running, etc." className="bg-white/10 border-white/30 text-white placeholder:text-white/60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="certifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white drop-shadow-sm">Certifications</FormLabel>
                          <FormControl>
                            <Input placeholder="USATF Level 2, RRCA, etc." className="bg-white/10 border-white/30 text-white placeholder:text-white/60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white drop-shadow-sm">Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Coach's biography and background"
                              rows={4}
                              className="bg-white/10 border-white/30 text-white placeholder:text-white/60 resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="photoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white drop-shadow-sm">Photo URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/photo.jpg" className="bg-white/10 border-white/30 text-white placeholder:text-white/60" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/30 bg-white/5 p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-white drop-shadow-sm">Active Status</FormLabel>
                            <p className="text-sm text-white/60 drop-shadow-sm">
                              Make this coach visible to users
                            </p>
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
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        type="submit" 
                        disabled={createCoachMutation.isPending || updateCoachMutation.isPending}
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30 drop-shadow-sm"
                      >
                        {(createCoachMutation.isPending || updateCoachMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editingCoachId ? "Update Coach" : "Add Coach"}
                      </Button>
                      
                      {editingCoachId && (
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                          className="bg-white/10 hover:bg-white/20 text-white border-white/30 drop-shadow-sm"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Coach List */}
            <Card className="lg:col-span-2 bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center text-white drop-shadow-sm">
                  <Users className="h-5 w-5 mr-2" />
                  Coaches List
                </CardTitle>
                <CardDescription className="text-white/70 drop-shadow-sm">
                  Manage existing coaches
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                ) : coaches.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 mx-auto text-white/60 mb-4" />
                    <h3 className="text-lg font-medium text-white drop-shadow-sm">No coaches yet</h3>
                    <p className="text-white/60 drop-shadow-sm mt-1">
                      Add your first coach using the form
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-3 px-4 text-white drop-shadow-sm">Name</th>
                          <th className="text-left py-3 px-4 hidden md:table-cell text-white drop-shadow-sm">Specialties</th>
                          <th className="text-left py-3 px-4 hidden lg:table-cell text-white drop-shadow-sm">Experience</th>
                          <th className="text-left py-3 px-4 text-white drop-shadow-sm">Status</th>
                          <th className="text-right py-3 px-4 text-white drop-shadow-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coaches.map((coach: any) => (
                          <tr key={coach.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-medium text-white drop-shadow-sm">{coach.name}</div>
                              <div className="text-sm text-white/60 drop-shadow-sm">{coach.title}</div>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell text-white/80 drop-shadow-sm">
                              {coach.specialties}
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell text-white/80 drop-shadow-sm">
                              {coach.experience_years} years
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium drop-shadow-sm ${
                                coach.status === 'active' 
                                  ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                                  : 'bg-red-500/20 text-red-300 border border-red-400/30'
                              }`}>
                                {coach.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditCoach(coach)}
                                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 drop-shadow-sm"
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => deleteCoachMutation.mutate(coach.id)}
                                  disabled={deleteCoachMutation.isPending}
                                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-400/30 drop-shadow-sm"
                                >
                                  {deleteCoachMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : 'Delete'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}