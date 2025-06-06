import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Loader2, Users, UserCog, Settings, Shield, Plus, Edit, Trash2, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AppLayout } from '@/components/layout/app-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_admin: boolean;
  permissions: string[];
  subscription_status: string;
  created_at: string;
}

interface Coach {
  id: number;
  name: string;
  email: string;
  specialties: string[];
  experience_years: number;
  bio: string;
  rating: number;
  is_active: boolean;
  user_count: number;
}

export default function AdminPanelPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isCoachDialogOpen, setIsCoachDialogOpen] = useState(false);
  const [newCoachData, setNewCoachData] = useState({
    name: '',
    email: '',
    specialties: '',
    experience_years: 0,
    bio: '',
  });

  // Check if user is admin
  if (!user?.is_admin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Shield className="h-16 w-16 text-red-400 mx-auto" />
                <h2 className="text-2xl font-bold text-white drop-shadow-sm">Access Denied</h2>
                <p className="text-white/70 drop-shadow-sm">
                  You need administrator privileges to access this panel.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/users');
      return await res.json();
    },
  });

  // Fetch coaches
  const { data: coaches = [], isLoading: coachesLoading } = useQuery({
    queryKey: ['/api/admin/coaches'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/coaches');
      return await res.json();
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role, isAdmin }: { userId: number; role: string; isAdmin: boolean }) => {
      const res = await apiRequest('PUT', `/api/admin/users/${userId}/role`, { role, is_admin: isAdmin });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Updated",
        description: "User role has been updated successfully.",
      });
      setIsUserDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  // Create coach mutation
  const createCoachMutation = useMutation({
    mutationFn: async (coachData: any) => {
      const res = await apiRequest('POST', '/api/admin/coaches', {
        ...coachData,
        specialties: coachData.specialties.split(',').map((s: string) => s.trim()),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coaches'] });
      toast({
        title: "Coach Created",
        description: "New coach has been added successfully.",
      });
      setIsCoachDialogOpen(false);
      setNewCoachData({
        name: '',
        email: '',
        specialties: '',
        experience_years: 0,
        bio: '',
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create new coach.",
        variant: "destructive",
      });
    },
  });

  // Toggle coach status mutation
  const toggleCoachStatusMutation = useMutation({
    mutationFn: async ({ coachId, isActive }: { coachId: number; isActive: boolean }) => {
      const res = await apiRequest('PUT', `/api/admin/coaches/${coachId}/status`, { is_active: isActive });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coaches'] });
      toast({
        title: "Coach Status Updated",
        description: "Coach status has been updated successfully.",
      });
    },
  });

  const handleUserRoleUpdate = () => {
    if (!selectedUser) return;
    
    updateUserRoleMutation.mutate({
      userId: selectedUser.id,
      role: selectedUser.role,
      isAdmin: selectedUser.is_admin,
    });
  };

  const handleCreateCoach = () => {
    createCoachMutation.mutate(newCoachData);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'coach': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
              Admin Panel
            </h1>
            <p className="text-white/70 drop-shadow-sm">
              Manage users, coaches, and platform settings
            </p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20">
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-white/20">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="coaches" className="text-white data-[state=active]:bg-white/20">
              <UserCog className="h-4 w-4 mr-2" />
              Coaches
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-white/20">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white drop-shadow-sm">User Management</CardTitle>
                <CardDescription className="text-white/70 drop-shadow-sm">
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead className="text-white/70">Username</TableHead>
                        <TableHead className="text-white/70">Email</TableHead>
                        <TableHead className="text-white/70">Role</TableHead>
                        <TableHead className="text-white/70">Subscription</TableHead>
                        <TableHead className="text-white/70">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: User) => (
                        <TableRow key={user.id} className="border-white/20">
                          <TableCell className="text-white drop-shadow-sm">
                            <div className="flex items-center gap-2">
                              {user.username}
                              {user.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-white/70 drop-shadow-sm">{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-white/30 text-white/70">
                              {user.subscription_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsUserDialogOpen(true);
                              }}
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coaches">
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white drop-shadow-sm">Coach Management</CardTitle>
                    <CardDescription className="text-white/70 drop-shadow-sm">
                      Manage coaches and their availability
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsCoachDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Coach
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {coachesLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20">
                        <TableHead className="text-white/70">Name</TableHead>
                        <TableHead className="text-white/70">Email</TableHead>
                        <TableHead className="text-white/70">Specialties</TableHead>
                        <TableHead className="text-white/70">Experience</TableHead>
                        <TableHead className="text-white/70">Users</TableHead>
                        <TableHead className="text-white/70">Status</TableHead>
                        <TableHead className="text-white/70">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coaches.map((coach: Coach) => (
                        <TableRow key={coach.id} className="border-white/20">
                          <TableCell className="text-white drop-shadow-sm">{coach.name}</TableCell>
                          <TableCell className="text-white/70 drop-shadow-sm">{coach.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {coach.specialties.slice(0, 2).map((specialty, index) => (
                                <Badge key={index} variant="outline" className="border-white/30 text-white/70 text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                              {coach.specialties.length > 2 && (
                                <Badge variant="outline" className="border-white/30 text-white/70 text-xs">
                                  +{coach.specialties.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-white/70 drop-shadow-sm">
                            {coach.experience_years} years
                          </TableCell>
                          <TableCell className="text-white/70 drop-shadow-sm">
                            {coach.user_count}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={coach.is_active}
                              onCheckedChange={(checked) => {
                                toggleCoachStatusMutation.mutate({
                                  coachId: coach.id,
                                  isActive: checked,
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-white drop-shadow-sm">Platform Settings</CardTitle>
                <CardDescription className="text-white/70 drop-shadow-sm">
                  Configure platform-wide settings and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">User Registration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Label className="text-white/70">Allow new user registration</Label>
                          <Switch defaultChecked />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Coach Applications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Label className="text-white/70">Allow coach applications</Label>
                          <Switch defaultChecked />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Edit Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="bg-gray-900/95 backdrop-blur-sm border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Edit User Role</DialogTitle>
              <DialogDescription className="text-white/70">
                Update user role and admin permissions
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Role</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
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
                    id="admin-switch"
                    checked={selectedUser.is_admin}
                    onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, is_admin: checked })}
                  />
                  <Label htmlFor="admin-switch" className="text-white">
                    Administrator privileges
                  </Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUserDialogOpen(false)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUserRoleUpdate}
                disabled={updateUserRoleMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                {updateUserRoleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Update Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Coach Dialog */}
        <Dialog open={isCoachDialogOpen} onOpenChange={setIsCoachDialogOpen}>
          <DialogContent className="bg-gray-900/95 backdrop-blur-sm border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Coach</DialogTitle>
              <DialogDescription className="text-white/70">
                Create a new coach profile
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Name</Label>
                <Input
                  value={newCoachData.name}
                  onChange={(e) => setNewCoachData({ ...newCoachData, name: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Coach name"
                />
              </div>
              <div>
                <Label className="text-white">Email</Label>
                <Input
                  type="email"
                  value={newCoachData.email}
                  onChange={(e) => setNewCoachData({ ...newCoachData, email: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="coach@example.com"
                />
              </div>
              <div>
                <Label className="text-white">Specialties (comma-separated)</Label>
                <Input
                  value={newCoachData.specialties}
                  onChange={(e) => setNewCoachData({ ...newCoachData, specialties: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Marathon, Speed Training, Nutrition"
                />
              </div>
              <div>
                <Label className="text-white">Experience (years)</Label>
                <Input
                  type="number"
                  value={newCoachData.experience_years}
                  onChange={(e) => setNewCoachData({ ...newCoachData, experience_years: parseInt(e.target.value) || 0 })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCoachDialogOpen(false)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCoach}
                disabled={createCoachMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              >
                {createCoachMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Create Coach
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}