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
import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
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

  // Handle role update
  const handleUpdateRole = () => {
    if (!selectedUser) return;
    
    updateUserRoleMutation.mutate({
      userId: selectedUser.id,
      role: selectedUser.role,
      isAdmin: selectedUser.is_admin
    });
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
      <div className="flex h-screen max-w-full overflow-hidden">
        <Sidebar />
        <MobileMenu />

        <main className="flex-1 overflow-y-auto pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
          {/* For mobile view padding to account for fixed header */}
          <div className="md:hidden pt-20"></div>
          
          <div className="container mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-white/70">Manage users, roles, and platform settings</p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-white/10 backdrop-blur-lg border border-white/20 h-auto p-1 grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-0 md:flex md:flex-wrap">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 h-auto py-2 md:py-2 text-xs md:text-sm flex-shrink-0">
                  <div className="flex flex-col md:flex-row items-center">
                    <BarChart3 className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
                    <span>Overview</span>
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
                    <span className="md:hidden">Impersonation</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 h-auto py-2 md:py-2 text-xs md:text-sm flex-shrink-0">
                  <div className="flex flex-col md:flex-row items-center">
                    <Settings className="h-4 w-4 mb-1 md:mb-0 md:mr-2" />
                    <span>Settings</span>
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

                    {usersLoading ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-white/20 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/20 hover:bg-white/5">
                              <TableHead className="text-white">User</TableHead>
                              <TableHead className="text-white">Role</TableHead>
                              <TableHead className="text-white">Status</TableHead>
                              <TableHead className="text-white">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((user) => (
                              <TableRow key={user.id} className="border-white/20 hover:bg-white/5">
                                <TableCell className="text-white">
                                  <div>
                                    <div className="font-medium">{user.username}</div>
                                    <div className="text-sm text-white/70">{user.email || 'No email'}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-white">
                                  <Badge variant={getRoleBadgeVariant(user.role, user.is_admin)} className="capitalize">
                                    {getRoleIcon(user.role, user.is_admin)}
                                    <span className="ml-1">
                                      {user.is_admin ? 'Admin' : user.role}
                                    </span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-white">
                                  <Badge variant="outline" className="text-white border-white/20">
                                    {user.subscription_status || 'Free'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsEditDialogOpen(true);
                                    }}
                                    className="border-white/20 text-white hover:bg-white/10"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="roles" className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Role Definitions</CardTitle>
                    <CardDescription className="text-white/70">
                      Understand different user roles and their permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(USER_ROLE_DESCRIPTIONS).map(([role, description]) => (
                      <div key={role} className="border border-white/20 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          {getRoleIcon(role as UserRole, role === 'admin')}
                          <h3 className="text-white font-semibold ml-2 capitalize">{role}</h3>
                        </div>
                        <p className="text-white/70 text-sm">{description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coaches" className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Coach Management</CardTitle>
                    <CardDescription className="text-white/70">
                      Manage coaching profiles and availability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {coachesLoading ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    ) : coaches.length === 0 ? (
                      <p className="text-white/70 text-center py-8">No coaches found</p>
                    ) : (
                      <div className="grid gap-4">
                        {coaches.map((coach) => (
                          <div key={coach.id} className="border border-white/20 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="text-white font-semibold">{coach.name}</h3>
                                <p className="text-white/70 text-sm">{coach.title}</p>
                                <p className="text-white/60 text-sm mt-2">{coach.bio}</p>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline" className="text-white border-white/20 text-xs">
                                    {coach.experience_years}+ years
                                  </Badge>
                                  <Badge variant="outline" className="text-white border-white/20 text-xs">
                                    ${coach.hourly_rate}/hr
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-white/20 text-white hover:bg-white/10"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                    Update user permissions and access level
                  </DialogDescription>
                </DialogHeader>
                
                {selectedUser && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Label className="text-white">Username</Label>
                        <div className="text-white/70">{selectedUser.username}</div>
                      </div>
                      <div className="flex-1">
                        <Label className="text-white">Email</Label>
                        <div className="text-white/70">{selectedUser.email || 'No email'}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white">Role</Label>
                      <Select 
                        value={selectedUser.role} 
                        onValueChange={(value: UserRole) => setSelectedUser({...selectedUser, role: value})}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedUser.is_admin}
                        onCheckedChange={(checked) => setSelectedUser({...selectedUser, is_admin: checked})}
                      />
                      <Label className="text-white">Administrator Privileges</Label>
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
        </main>
      </div>
    </div>
  );
}