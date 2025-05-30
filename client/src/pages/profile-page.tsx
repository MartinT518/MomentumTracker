import { Sidebar } from "@/components/common/sidebar";
import { MobileMenu } from "@/components/common/mobile-menu";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Save, ExternalLink, Mail, Bell, User as UserIcon, Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [updating, setUpdating] = useState(false);
  
  // Profile information
  const [name, setName] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [age, setAge] = useState(user?.age?.toString() || "");
  const [weight, setWeight] = useState(user?.weight?.toString() || "");
  const [height, setHeight] = useState(user?.height?.toString() || "");
  const [experience, setExperience] = useState(user?.experience_level || "intermediate");
  
  // API integrations
  const [stravaConnected, setStravaConnected] = useState(false);
  const [garminConnected, setGarminConnected] = useState(false);
  const [polarConnected, setPolarConnected] = useState(false);
  const [googleFitConnected, setGoogleFitConnected] = useState(false);
  const [whoopConnected, setWhoopConnected] = useState(false);
  const [appleHealthConnected, setAppleHealthConnected] = useState(false);
  const [fitbitConnected, setFitbitConnected] = useState(false);
  
  // Notification settings  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState(true);

  const handleSaveProfile = () => {
    setUpdating(true);
    // Simulate API call delay
    setTimeout(() => {
      setUpdating(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    }, 1000);
  };

  const handleConnectStrava = () => {
    // In a real implementation, redirect to Strava OAuth flow
    window.open("https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&approval_prompt=force&scope=read,activity:read", "_blank");
    
    toast({
      title: "Connect to Strava",
      description: "Please complete the authorization process in the opened window.",
    });
  };

  const handleConnectGarmin = () => {
    // In a real implementation, redirect to Garmin Connect authentication
    toast({
      title: "Garmin Connect",
      description: "Garmin Connect API integration would initiate here.",
    });
  };

  const handleConnectPolar = () => {
    // In a real implementation, redirect to Polar authentication
    toast({
      title: "Polar Flow",
      description: "Polar Flow API integration would initiate here.",
    });
  };

  const handleConnectGoogleFit = () => {
    // In a real implementation, redirect to Google Fit OAuth flow
    window.open("https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read", "_blank");
    
    toast({
      title: "Connect to Google Fit",
      description: "Please complete the authorization process in the opened window.",
    });
  };

  const handleConnectWhoop = () => {
    // In a real implementation, redirect to WHOOP OAuth flow
    window.open("https://api.prod.whoop.com/oauth/oauth2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=read:recovery read:workout read:sleep read:profile", "_blank");
    
    toast({
      title: "Connect to WHOOP",
      description: "Please complete the authorization process in the opened window.",
    });
  };

  const handleConnectAppleHealth = () => {
    // In a real implementation, direct user to download the companion iOS app
    toast({
      title: "Apple Health",
      description: "Download our iOS app to connect Apple Health data. Search 'AetherRun' on the App Store.",
    });
  };

  const handleConnectFitbit = () => {
    // In a real implementation, redirect to Fitbit OAuth flow
    window.open("https://www.fitbit.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&response_type=code&scope=activity heartrate sleep profile&redirect_uri=YOUR_REDIRECT_URI", "_blank");
    
    toast({
      title: "Connect to Fitbit",
      description: "Please complete the authorization process in the opened window.",
    });
  };

  return (
    <div className="flex h-screen max-w-full overflow-hidden">
      <Sidebar />
      <MobileMenu />

      <main className="flex-1 overflow-y-auto bg-neutral-lighter pt-0 md:pt-4 pb-16 md:pb-4 px-4 md:px-6">
        {/* For mobile view padding to account for fixed header */}
        <div className="md:hidden pt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-2 px-1">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl font-bold font-heading text-neutral-darker">Profile & Settings</h1>
            <p className="text-neutral-medium mt-1">Manage your personal details, connections, and preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center">
              <ExternalLink className="w-4 h-4 mr-2" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and runner profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Username</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Your username" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="Your email address" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input 
                        id="age" 
                        type="number" 
                        value={age} 
                        onChange={(e) => setAge(e.target.value)} 
                        placeholder="Your age" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input 
                        id="weight" 
                        type="number" 
                        value={weight} 
                        onChange={(e) => setWeight(e.target.value)} 
                        placeholder="Your weight in kg" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input 
                        id="height" 
                        type="number" 
                        value={height} 
                        onChange={(e) => setHeight(e.target.value)} 
                        placeholder="Your height in cm" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Running Experience</Label>
                    <select 
                      id="experience" 
                      value={experience} 
                      onChange={(e) => setExperience(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveProfile} disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>Update your profile image</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl">{name ? name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Upload Image</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Activity Data Connections</CardTitle>
                <CardDescription>
                  Connect your accounts to import activities from other platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Strava */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-orange-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                        <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
                        <path d="m13 11 5 5-5 5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Strava</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect to automatically sync activities from Strava
                      </p>
                      {stravaConnected && (
                        <div className="mt-1 flex items-center">
                          <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 hover:bg-green-50">Auto-sync ON</Badge>
                          <span className="text-xs text-muted-foreground">New activities are imported automatically</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {stravaConnected ? (
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                          Revoke Access
                        </Button>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={handleConnectStrava}>Connect</Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">Connecting allows automatic import of new activities. You can revoke access anytime.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                
                {/* Garmin Connect */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                        <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
                        <circle cx="12" cy="12" r="2" />
                        <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
                        <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Garmin Connect</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect to automatically sync activities from Garmin
                      </p>
                      {garminConnected && (
                        <div className="mt-1 flex items-center">
                          <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 hover:bg-green-50">Auto-sync ON</Badge>
                          <span className="text-xs text-muted-foreground">New activities are imported automatically</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {garminConnected ? (
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                          Revoke Access
                        </Button>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={handleConnectGarmin}>Connect</Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">Connecting allows automatic import of new activities. You can revoke access anytime.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                
                {/* Polar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Polar Flow</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect to automatically sync activities from Polar
                      </p>
                      {polarConnected && (
                        <div className="mt-1 flex items-center">
                          <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 hover:bg-green-50">Auto-sync ON</Badge>
                          <span className="text-xs text-muted-foreground">New activities are imported automatically</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {polarConnected ? (
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                          Revoke Access
                        </Button>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={handleConnectPolar}>Connect</Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">Connecting allows automatic import of new activities. You can revoke access anytime.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              
                {/* Google Fit */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M18 20V10" />
                        <path d="M12 20V4" />
                        <path d="M6 20v-6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Google Fit</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect to import activities, steps, and heart rate data
                      </p>
                      {googleFitConnected && (
                        <div className="mt-1 flex items-center">
                          <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 hover:bg-green-50">Auto-sync ON</Badge>
                          <span className="text-xs text-muted-foreground">Data syncs every hour</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {googleFitConnected ? (
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                          Revoke Access
                        </Button>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={handleConnectGoogleFit}>Connect</Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">Connect to Google Fit to import activities and health metrics.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                
                {/* WHOOP */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">WHOOP</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect to import recovery data, strain, and sleep metrics
                      </p>
                      {whoopConnected && (
                        <div className="mt-1 flex items-center">
                          <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 hover:bg-green-50">Auto-sync ON</Badge>
                          <span className="text-xs text-muted-foreground">Recovery score updates daily</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {whoopConnected ? (
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                          Revoke Access
                        </Button>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={handleConnectWhoop}>Connect</Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">Connect to WHOOP to import recovery scores and sleep data.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                
                {/* Apple Health */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Apple Health</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect to import health data from your iPhone and Apple Watch
                      </p>
                      {appleHealthConnected && (
                        <div className="mt-1 flex items-center">
                          <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 hover:bg-green-50">Companion App Connected</Badge>
                          <span className="text-xs text-muted-foreground">Manual sync via iOS app</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {appleHealthConnected ? (
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={handleConnectAppleHealth}>Get iOS App</Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">Download our iOS app to connect Apple Health data.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                
                {/* Fitbit */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                        <path d="M21 12c0-4.418-3.582-8-8-8s-8 3.582-8 8 3.582 8 8 8 8-3.582 8-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Fitbit</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect to import activities, sleep, and heart rate data
                      </p>
                      {fitbitConnected && (
                        <div className="mt-1 flex items-center">
                          <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 hover:bg-green-50">Auto-sync ON</Badge>
                          <span className="text-xs text-muted-foreground">Data syncs every 8 hours</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {fitbitConnected ? (
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                          Revoke Access
                        </Button>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button onClick={handleConnectFitbit}>Connect</Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">Connect to Fitbit to import activities and health metrics.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                
                {/* Data Usage Notice */}
                <div className="mt-6 p-4 bg-amber-50 rounded-md border border-amber-200">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Data Privacy & Usage Consent</h4>
                  <p className="text-xs text-amber-700 mb-2">
                    By connecting fitness platforms, you consent to AetherRun accessing your activity and health data to:
                  </p>
                  <ul className="text-xs text-amber-700 list-disc pl-5 space-y-1">
                    <li>Generate personalized training plans tailored to your fitness level</li>
                    <li>Calculate recovery metrics based on health data</li>
                    <li>Provide advanced performance analytics and recommendations</li>
                    <li>Track your progress toward fitness goals</li>
                  </ul>
                  <p className="text-xs text-amber-700 mt-2">
                    You can revoke access at any time. We never share your data with third parties.
                  </p>
                </div>
              </CardContent>
              
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Connecting allows us to automatically import your activities from these platforms.
                  Your login credentials are never stored.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Workout Reminders</h3>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about upcoming workouts
                    </p>
                  </div>
                  <Switch
                    checked={workoutReminders}
                    onCheckedChange={setWorkoutReminders}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Progress Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Weekly summaries of your training progress
                    </p>
                  </div>
                  <Switch
                    checked={progressUpdates}
                    onCheckedChange={setProgressUpdates}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => {
                  toast({
                    title: "Notification settings saved",
                    description: "Your notification preferences have been updated.",
                  });
                }}>
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                  Delete Account
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Password updated",
                    description: "Your password has been changed successfully.",
                  });
                }}>
                  Update Password
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
