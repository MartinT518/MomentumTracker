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
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLE_DESCRIPTIONS, UserRole } from "@shared/user-roles";
import { ImpersonationPanel } from "@/components/admin/impersonation-panel";
import { Users, UserCheck, Settings, BarChart3, Shield, Crown, Star, ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";

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

export default function AdminPanelPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Check if user has admin access
  if (!user || (user.role !== 'admin' && !user.is_admin)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 p-8">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <CardTitle className="text-white">Access Denied</CardTitle>
            <CardDescription className="text-white/70">
              Admin privileges required to access this page
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
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
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
      {/* Navigation Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/20"></div>
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white/70 text-sm">
                Welcome, {user?.username}
              </div>
              <Badge variant="default" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                <Crown className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl p-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-white/70">Manage users, roles, and platform settings</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-lg border border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white/20">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-white/20">
              <Shield className="h-4 w-4 mr-2" />
              Role Definitions
            </TabsTrigger>
            <TabsTrigger value="impersonation" className="data-[state=active]:bg-white/20">
              <UserCheck className="h-4 w-4 mr-2" />
              User Impersonation
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-white/20">
              <Settings className="h-4 w-4 mr-2" />
              Settings
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
                  Manage user accounts and permissions
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white w-full sm:w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">Regular Users</SelectItem>
                      <SelectItem value="coach">Coaches</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
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
                      <span className="ml-2">{description.name}</span>
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {description.description}
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

          <TabsContent value="impersonation" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <UserCheck className="h-5 w-5 mr-2" />
                  User Impersonation
                </CardTitle>
                <CardDescription className="text-white/70">
                  Switch between different user interfaces to test features and provide support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImpersonationPanel />
              </CardContent>
            </Card>
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