import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/common/app-layout';
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
import { Shield, Unlock, UserCog, BellRing, Activity } from 'lucide-react';
import { IntegrationSettings } from '@/components/settings/integration-settings';
import { TrainingPreferences } from '@/components/settings/training-preferences';
import { Link } from 'wouter';

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
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">Settings</h2>
          <p className="text-white/70 drop-shadow-sm">Manage your account, security, and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-5 h-auto md:grid-cols-5 bg-white/10 backdrop-blur-sm border-white/20">
            <TabsTrigger value="account" className="flex flex-col md:flex-row items-center gap-2 py-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <UserCog className="h-5 w-5" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex flex-col md:flex-row items-center gap-2 py-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex flex-col md:flex-row items-center gap-2 py-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Activity className="h-5 w-5" />
              <span>Training</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex flex-col md:flex-row items-center gap-2 py-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <Unlock className="h-5 w-5" />
              <span>Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col md:flex-row items-center gap-2 py-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
              <BellRing className="h-5 w-5" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white drop-shadow-sm">Profile Settings</CardTitle>
                <CardDescription className="text-white/80 drop-shadow-sm">
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
                          <FormLabel className="text-white drop-shadow-sm">Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Username" {...field} className="bg-white/10 border-white/30 text-white placeholder:text-white/50" />
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
                          <FormLabel className="text-white drop-shadow-sm">Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Email" {...field} className="bg-white/10 border-white/30 text-white placeholder:text-white/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
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
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white drop-shadow-sm">Password</CardTitle>
                <CardDescription className="text-white/80 drop-shadow-sm">
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
                          <FormLabel className="text-white drop-shadow-sm">Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Current password" {...field} className="bg-white/10 border-white/30 text-white placeholder:text-white/50" />
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
                          <FormLabel className="text-white drop-shadow-sm">New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="New password" {...field} className="bg-white/10 border-white/30 text-white placeholder:text-white/50" />
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
                          <FormLabel className="text-white drop-shadow-sm">Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm password" {...field} className="bg-white/10 border-white/30 text-white placeholder:text-white/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      disabled={updatePasswordMutation.isPending || !securityForm.formState.isDirty}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Training Preferences */}
          <TabsContent value="training" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white drop-shadow-sm">Training Preferences</CardTitle>
                <CardDescription className="text-white/80 drop-shadow-sm">
                  Update your training preferences to get customized training plans and workouts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrainingPreferences />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <IntegrationSettings />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white drop-shadow-sm">Notification Preferences</CardTitle>
                <CardDescription className="text-white/80 drop-shadow-sm">
                  Choose which notifications you'd like to receive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-white drop-shadow-sm">Email Notifications</Label>
                    <p className="text-sm text-white/60 drop-shadow-sm">
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
                    <Label htmlFor="training-reminders" className="text-white drop-shadow-sm">Training Reminders</Label>
                    <p className="text-sm text-white/60 drop-shadow-sm">
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
                    <Label htmlFor="achievement-alerts" className="text-white drop-shadow-sm">Achievement Alerts</Label>
                    <p className="text-sm text-white/60 drop-shadow-sm">
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
                    <Label htmlFor="community-updates" className="text-white drop-shadow-sm">Community Updates</Label>
                    <p className="text-sm text-white/60 drop-shadow-sm">
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
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}