import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/common/sidebar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Shield, Unlock, UserCog, BellRing } from 'lucide-react';

const profileFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Current password is required.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(1, {
    message: "Please confirm your password.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type SecurityFormValues = z.infer<typeof securityFormSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
    },
  });

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Integrations settings
  const [stravaConnected, setStravaConnected] = useState(false);
  const [garminConnected, setGarminConnected] = useState(false);
  const [polarConnected, setPolarConnected] = useState(false);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [trainingReminders, setTrainingReminders] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [communityUpdates, setCommunityUpdates] = useState(false);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest('PATCH', '/api/user', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: SecurityFormValues) => {
      const res = await apiRequest('PATCH', '/api/user/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update password');
      }
      return await res.json();
    },
    onSuccess: () => {
      securityForm.reset();
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Connect integration mutation (stub for now)
  const connectIntegrationMutation = useMutation({
    mutationFn: async ({ service, connect }: { service: string; connect: boolean }) => {
      const res = await apiRequest('POST', '/api/integrations', { service, connect });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${connect ? 'connect' : 'disconnect'} ${service}`);
      }
      return await res.json();
    },
    onSuccess: (data, variables) => {
      const { service, connect } = variables;
      toast({
        title: connect ? "Connected" : "Disconnected",
        description: `${service} was successfully ${connect ? 'connected' : 'disconnected'}.`,
      });
      
      // Update state based on which service was modified
      if (service === 'strava') setStravaConnected(connect);
      if (service === 'garmin') setGarminConnected(connect);
      if (service === 'polar') setPolarConnected(connect);
    },
    onError: (error: Error, variables) => {
      const { service, connect } = variables;
      toast({
        title: `${connect ? 'Connection' : 'Disconnection'} Failed`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update notification settings mutation (stub for now)
  const updateNotificationsMutation = useMutation({
    mutationFn: async (settings: { [key: string]: boolean }) => {
      const res = await apiRequest('PATCH', '/api/user/notifications', settings);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update notification settings');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onSecuritySubmit = (data: SecurityFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  const handleIntegrationToggle = (service: string, currentState: boolean) => {
    connectIntegrationMutation.mutate({ service, connect: !currentState });
  };

  const saveNotificationSettings = () => {
    updateNotificationsMutation.mutate({
      emailNotifications,
      trainingReminders,
      achievementAlerts,
      communityUpdates,
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 h-auto md:grid-cols-4">
            <TabsTrigger value="account" className="flex flex-col md:flex-row items-center gap-2 py-2">
              <UserCog className="h-5 w-5" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex flex-col md:flex-row items-center gap-2 py-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex flex-col md:flex-row items-center gap-2 py-2">
              <Unlock className="h-5 w-5" />
              <span>Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col md:flex-row items-center gap-2 py-2">
              <BellRing className="h-5 w-5" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your account information and personal details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                    >
                      {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...securityForm}>
                  <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                    <FormField
                      control={securityForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="New password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={securityForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={updatePasswordMutation.isPending || !securityForm.formState.isDirty}
                    >
                      {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connected Services</CardTitle>
                <CardDescription>
                  Connect your fitness accounts to sync your activities and data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">ST</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium leading-none">Strava</p>
                      <p className="text-sm text-muted-foreground">
                        {stravaConnected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant={stravaConnected ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleIntegrationToggle('strava', stravaConnected)}
                    disabled={connectIntegrationMutation.isPending}
                  >
                    {stravaConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">GC</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium leading-none">Garmin Connect</p>
                      <p className="text-sm text-muted-foreground">
                        {garminConnected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={garminConnected ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleIntegrationToggle('garmin', garminConnected)}
                    disabled={connectIntegrationMutation.isPending}
                  >
                    {garminConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">PL</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium leading-none">Polar</p>
                      <p className="text-sm text-muted-foreground">
                        {polarConnected ? "Connected" : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={polarConnected ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleIntegrationToggle('polar', polarConnected)}
                    disabled={connectIntegrationMutation.isPending}
                  >
                    {polarConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Connecting your accounts allows us to automatically import your activities.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose which notifications you'd like to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important updates via email.
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="training-reminders">Training Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about your upcoming workouts.
                    </p>
                  </div>
                  <Switch
                    id="training-reminders"
                    checked={trainingReminders}
                    onCheckedChange={setTrainingReminders}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="achievement-alerts">Achievement Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when you earn achievements.
                    </p>
                  </div>
                  <Switch
                    id="achievement-alerts"
                    checked={achievementAlerts}
                    onCheckedChange={setAchievementAlerts}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="community-updates">Community Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Stay informed about community events and challenges.
                    </p>
                  </div>
                  <Switch
                    id="community-updates"
                    checked={communityUpdates}
                    onCheckedChange={setCommunityUpdates}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={saveNotificationSettings}
                  disabled={updateNotificationsMutation.isPending}
                >
                  {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}