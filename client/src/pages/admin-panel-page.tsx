import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLE_DESCRIPTIONS, UserRole } from "@shared/user-roles";
import { ImpersonationPanel } from "@/components/admin/impersonation-panel";
import { Users, UserCheck, Settings, BarChart3, Shield, Crown, Star, ArrowLeft, Home, UserPlus, Edit, Trash2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface User {
  id: number;
  username: string;
  email?: string;
  role: UserRole;
  is_admin: boolean;
  subscription_status: string;
  created_at: string;
}

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  coaches: number;
  premiumUsers: number;
  revenue: number;
}

interface Coach {
  id: number;
  name: string;
  email?: string;
  title: string;
  bio: string;
  specialties: string;
  certifications: string;
  experience_years: string;
  photo_url?: string;
  status: string;
  hourly_rate: string;
}

// Zod schema for coach form validation
const coachFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  bio: z.string().min(10, { message: "Bio must be at least 10 characters." }),
  specialties: z.string().min(5, { message: "Specialties must be at least 5 characters." }),
  certifications: z.string().min(5, { message: "Certifications must be at least 5 characters." }),
  experience_years: z.string().regex(/^\d+$/, { message: "Must be a number." }),
  photoUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  hourlyRate: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Please enter a valid price." }),
});

type CoachFormValues = z.infer<typeof coachFormSchema>;

export default function AdminPanelPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingCoachId, setEditingCoachId] = useState<number | null>(null);

  // Coach form initialization
  const coachForm = useForm<CoachFormValues>({
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

  // Check if user has admin access
  if (!user || (user.role !== 'admin' && !user.is_admin)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 p-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="h-6 w-6 mr-2" />
              Access Denied
            </CardTitle>
            <CardDescription className="text-white/70">
              You need administrator privileges to access this panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch all users
  const { data: usersData, isLoading: usersLoading } = useQuery<{users: User[]}>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
  });

  const users = usersData?.users || [];

  // Fetch platform statistics
  const { data: stats } = useQuery<PlatformStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      return response.json();
    },
  });

  // Fetch all coaches
  const { data: coaches = [], isLoading: coachesLoading } = useQuery<Coach[]>({
    queryKey: ['/api/coaches/all'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/coaches/all');
      return response.json();
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role, isAdmin }: { userId: number; role: UserRole; isAdmin: boolean }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}/role`, {
        role,
        is_admin: isAdmin
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Coach management mutations
  const createCoachMutation = useMutation({
    mutationFn: async (data: CoachFormValues) => {
      const res = await apiRequest('POST', '/api/coaches', {
        ...data,
        experience_years: data.experience_years,
        hourlyRate: data.hourlyRate,
        status: data.isActive ? 'active' : 'inactive',
        specialties: data.specialties,
        photo_url: data.photoUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coach created successfully!",
      });
      coachForm.reset();
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

  const updateCoachMutation = useMutation({
    mutationFn: async (data: CoachFormValues & { id: number }) => {
      const { id, ...rest } = data;
      const res = await apiRequest('PUT', `/api/coaches/${id}`, {
        ...rest,
        experience_years: rest.experience_years,
        hourlyRate: rest.hourlyRate,
        status: rest.isActive ? 'active' : 'inactive',
        specialties: rest.specialties,
        photo_url: rest.photoUrl,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coach updated successfully!",
      });
      coachForm.reset();
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRole = () => {
    if (!selectedUser) return;
    
    updateUserRoleMutation.mutate({
      userId: selectedUser.id,
      role: selectedUser.role,
      isAdmin: selectedUser.is_admin
    });
    setIsEditDialogOpen(false);
  };

  // Coach management helper functions
  const onCoachSubmit = (data: CoachFormValues) => {
    if (editingCoachId) {
      updateCoachMutation.mutate({ ...data, id: editingCoachId });
    } else {
      createCoachMutation.mutate(data);
    }
  };

  const handleEditCoach = (coach: Coach) => {
    coachForm.reset({
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
  };

  const handleCancelCoachEdit = () => {
    coachForm.reset();
    setEditingCoachId(null);
  };

  const getRoleIcon = (role: UserRole, isAdmin: boolean) => {
    if (isAdmin) return <Crown className="h-4 w-4 text-yellow-400" />;
    if (role === 'coach') return <Star className="h-4 w-4 text-blue-400" />;
    return <Users className="h-4 w-4 text-gray-400" />;
  };

  const getRoleBadgeVariant = (role: UserRole, isAdmin: boolean) => {
    if (isAdmin) return "default";
    if (role === 'coach') return "secondary";
    return "outline";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto max-w-7xl p-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-white/70">Manage users, roles, and platform settings</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-lg border border-white/20 h-auto p-1 grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-0 md:flex md:flex-wrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 h-auto py-2 md:py-2 text-xs md:text-sm flex-shrink-0">
              <div className="flex flex-col md:flex-row items-center">
                <BarChart3 className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
                <span className="hidden md:inline">Overview</span>
                <span className="md:hidden">Stats</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white/20 h-auto py-2 md:py-2 text-xs md:text-sm flex-shrink-0">
              <div className="flex flex-col md:flex-row items-center">
                <Users className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
                <span className="hidden md:inline">User Management</span>
                <span className="md:hidden">Users</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-white/20 h-auto py-2 md:py-2 text-xs md:text-sm flex-shrink-0">
              <div className="flex flex-col md:flex-row items-center">
                <Shield className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
                <span className="hidden md:inline">Role Definitions</span>
                <span className="md:hidden">Roles</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="coaches" className="data-[state=active]:bg-white/20 h-auto py-2 md:py-2 text-xs md:text-sm flex-shrink-0">
              <div className="flex flex-col md:flex-row items-center">
                <Star className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
                <span className="hidden md:inline">Coach Management</span>
                <span className="md:hidden">Coaches</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="impersonation" className="data-[state=active]:bg-white/20 h-auto py-2 md:py-2 text-xs md:text-sm flex-shrink-0">
              <div className="flex flex-col md:flex-row items-center">
                <UserCheck className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
                <span className="hidden md:inline">User Impersonation</span>
                <span className="md:hidden">Switch</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 h-auto py-2 md:py-2 text-xs md:text-sm flex-shrink-0">
              <div className="flex flex-col md:flex-row items-center">
                <Settings className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
                <span className="hidden md:inline">Settings</span>
                <span className="md:hidden">Config</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</div>
                  <p className="text-white/70 text-sm">Registered users</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center">
                    <UserCheck className="h-5 w-5 mr-2" />
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats?.activeUsers || 0}</div>
                  <p className="text-white/70 text-sm">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Coaches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats?.coaches || 0}</div>
                  <p className="text-white/70 text-sm">Verified coaches</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center">
                    <Crown className="h-5 w-5 mr-2" />
                    Premium Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{stats?.premiumUsers || 0}</div>
                  <p className="text-white/70 text-sm">Active subscriptions</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-white/70">
                  Manage user accounts, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">Users</SelectItem>
                      <SelectItem value="coach">Coaches</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-white">User</TableHead>
                      <TableHead className="text-white">Role</TableHead>
                      <TableHead className="text-white">Subscription</TableHead>
                      <TableHead className="text-white">Joined</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-white/20">
                        <TableCell>
                          <div className="text-white">
                            <div className="font-medium">{user.username}</div>
                            {user.email && (
                              <div className="text-sm text-white/70">{user.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role, user.is_admin)} className="flex items-center w-fit">
                            {getRoleIcon(user.role, user.is_admin)}
                            <span className="ml-1">
                              {user.is_admin ? 'Admin' : user.role === 'coach' ? 'Coach' : 'User'}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.subscription_status === 'active' ? 'default' : 'outline'}>
                            {user.subscription_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/70">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              Edit
                            </Button>
                            {user.id !== user.id && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={deleteUserMutation.isPending}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(USER_ROLE_DESCRIPTIONS).map(([role, description]) => (
                <Card key={role} className="bg-white/10 backdrop-blur-lg border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      {getRoleIcon(role as UserRole, role === 'admin')}
                      <span className="ml-2 capitalize">{role}</span>
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {description.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Key Functions:</h4>
                      <ul className="text-sm text-white/70 space-y-1">
                        {description.keyFunctions.slice(0, 5).map((func, index) => (
                          <li key={index}>• {func}</li>
                        ))}
                        {description.keyFunctions.length > 5 && (
                          <li className="italic">...and {description.keyFunctions.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-white mb-2">Restrictions:</h4>
                      <ul className="text-sm text-white/70 space-y-1">
                        {description.restrictions.map((restriction, index) => (
                          <li key={index}>• {restriction}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="coaches" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Coach Management</h2>
              <Button
                onClick={() => {
                  coachForm.reset();
                  setEditingCoachId(null);
                }}
                className="bg-blue-500 hover:bg-blue-400 text-white"
                disabled={createCoachMutation.isPending}
              >
                {createCoachMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Add New Coach
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coach Form */}
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">
                    {editingCoachId ? 'Edit Coach' : 'Add New Coach'}
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    {editingCoachId ? 'Update coach information' : 'Create a new coach profile'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...coachForm}>
                    <form onSubmit={coachForm.handleSubmit(onCoachSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={coachForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white/10 border-white/20 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={coachForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" className="bg-white/10 border-white/20 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={coachForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Professional Title</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-white/10 border-white/20 text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={coachForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Biography</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="bg-white/10 border-white/20 text-white" rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={coachForm.control}
                          name="specialties"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Specialties</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white/10 border-white/20 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={coachForm.control}
                          name="experience_years"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Years of Experience</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" className="bg-white/10 border-white/20 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={coachForm.control}
                        name="certifications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Certifications</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="bg-white/10 border-white/20 text-white" rows={2} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={coachForm.control}
                          name="hourlyRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Hourly Rate ($)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" className="bg-white/10 border-white/20 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={coachForm.control}
                          name="photoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Photo URL</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white/10 border-white/20 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={coachForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/20 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-white">Active Status</FormLabel>
                              <div className="text-sm text-white/70">
                                Active coaches are visible to users
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

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={createCoachMutation.isPending || updateCoachMutation.isPending}
                          className="bg-blue-500 hover:bg-blue-400 text-white"
                        >
                          {createCoachMutation.isPending || updateCoachMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {editingCoachId ? 'Update Coach' : 'Create Coach'}
                        </Button>
                        {editingCoachId && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelCoachEdit}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Coaches List */}
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Existing Coaches</CardTitle>
                  <CardDescription className="text-white/70">
                    Manage all registered coaches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {coachesLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  ) : coaches.length === 0 ? (
                    <div className="text-center p-8 text-white/70">
                      No coaches registered yet
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {coaches.map((coach) => (
                        <div
                          key={coach.id}
                          className="flex items-start justify-between p-4 border border-white/20 rounded-lg bg-white/5"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-white">{coach.name}</h4>
                              <Badge variant={coach.status === 'active' ? 'default' : 'secondary'}>
                                {coach.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-white/70 mb-1">{coach.title}</p>
                            <p className="text-sm text-white/60">${coach.hourly_rate}/hour</p>
                            <p className="text-xs text-white/50 mt-1">
                              {coach.experience_years} years experience
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCoach(coach)}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteCoachMutation.mutate(coach.id)}
                              disabled={deleteCoachMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="impersonation" className="space-y-6">
            <ImpersonationPanel />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white">System Settings</CardTitle>
                <CardDescription className="text-white/70">
                  Configure platform settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">System settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-slate-900 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Edit User Role</DialogTitle>
              <DialogDescription className="text-white/70">
                Update user role and permissions
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Username</Label>
                  <Input 
                    value={selectedUser.username} 
                    disabled 
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-white">Role</Label>
                  <Select 
                    value={selectedUser.role} 
                    onValueChange={(value: UserRole) => 
                      setSelectedUser({...selectedUser, role: value})
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Regular User</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="admin-checkbox"
                    checked={selectedUser.is_admin}
                    onChange={(e) => 
                      setSelectedUser({...selectedUser, is_admin: e.target.checked})
                    }
                    className="rounded border-white/20"
                  />
                  <Label htmlFor="admin-checkbox" className="text-white">
                    Grant admin privileges
                  </Label>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateRole}
                disabled={updateUserRoleMutation.isPending}
              >
                Update Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}