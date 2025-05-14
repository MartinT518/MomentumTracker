import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema } from "@shared/schema";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ChevronRight, Zap, Brain, LineChart, Dumbbell, Activity, Heart } from "lucide-react";
import RunnerAnimation from "@/components/ui/runner-animation";
import AITrainingGenerator from "@/components/ui/ai-training-generator";
import FitnessIntegration from "@/components/ui/fitness-integration";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("login");

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (values: LoginValues) => {
    try {
      await loginMutation.mutateAsync({
        username: values.username,
        password: values.password,
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const onRegisterSubmit = async (values: RegisterValues) => {
    try {
      const { confirmPassword, ...userData } = values;
      await registerMutation.mutateAsync({
        username: userData.username,
        email: userData.email,
        password: userData.password,
      });
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Form Column - Left side */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12 lg:bg-white">
        <Card className="w-full max-w-md shadow-none border-0 bg-transparent">
          <CardContent className="pt-6 px-0 lg:px-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">
                <span className="text-primary">Momentum</span>Run
              </h1>
              <p className="text-muted-foreground">Your AI-powered running companion</p>
            </div>

            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-red-500 hover:bg-red-600 text-white" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Login
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button 
                      className="text-primary hover:underline" 
                      onClick={() => setActiveTab("register")}
                    >
                      Register
                    </button>
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-red-500 hover:bg-red-600 text-white" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Register
                    </Button>
                  </form>
                </Form>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button 
                      className="text-primary hover:underline" 
                      onClick={() => setActiveTab("login")}
                    >
                      Login
                    </button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Hero Column - Right side */}
      <div className="w-full lg:w-3/5 bg-gradient-to-br from-blue-900 to-indigo-900 p-8 flex flex-col justify-center lg:min-h-screen hidden lg:flex overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 text-white">Transform Your Running Journey</h1>
            <p className="text-lg text-blue-100 mb-8 leading-relaxed">
              MomentumRun combines AI-powered training plans, advanced data integration, and intelligent health tracking to push your limits and achieve your running goals.
            </p>
          </div>
          
          {/* Runner Animation */}
          <div className="mb-8">
            <RunnerAnimation />
          </div>
          
          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <div className="flex items-center mb-2">
                <div className="bg-blue-600 p-2 rounded-lg mr-3">
                  <Brain size={20} />
                </div>
                <h3 className="font-bold">AI-Powered Training</h3>
              </div>
              <p className="text-sm opacity-90">
                Personalized plans built by Google's Gemini AI that adapt to your performance, goals, and recovery patterns in real-time.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <div className="flex items-center mb-2">
                <div className="bg-purple-600 p-2 rounded-lg mr-3">
                  <LineChart size={20} />
                </div>
                <h3 className="font-bold">Advanced Analytics</h3>
              </div>
              <p className="text-sm opacity-90">
                Gain deep insights into your pace, heart rate, and energy levels with visualization tools that help identify patterns and improvements.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <div className="flex items-center mb-2">
                <div className="bg-indigo-600 p-2 rounded-lg mr-3">
                  <Activity size={20} />
                </div>
                <h3 className="font-bold">Platform Integration</h3>
              </div>
              <p className="text-sm opacity-90">
                Sync your activities automatically from Strava, Garmin Connect, and Polar to keep all your training data in one place.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <div className="flex items-center mb-2">
                <div className="bg-green-600 p-2 rounded-lg mr-3">
                  <Heart size={20} />
                </div>
                <h3 className="font-bold">Health Intelligence</h3>
              </div>
              <p className="text-sm opacity-90">
                Monitor energy levels calculated from HRV, resting heart rate, and sleep quality to optimize training and prevent overtraining.
              </p>
            </div>
          </div>
          
          {/* Integration Visualization */}
          <div className="mb-8">
            <FitnessIntegration />
          </div>
          
          {/* AI Training Generator */}
          <div className="mb-8">
            <AITrainingGenerator />
          </div>
          
          {/* Premium Features */}
          <div className="bg-gradient-to-r from-indigo-700/40 to-purple-700/40 rounded-xl p-6 mb-8 border border-indigo-500/30">
            <div className="flex items-center mb-4">
              <Zap size={24} className="text-yellow-400 mr-3" />
              <h3 className="text-xl font-bold text-white">Premium Benefits</h3>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start text-white">
                <ChevronRight className="h-5 w-5 mr-2 text-blue-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Access to human coaches for personalized guidance and plan adjustments</span>
              </li>
              <li className="flex items-start text-white">
                <ChevronRight className="h-5 w-5 mr-2 text-blue-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Advanced nutrition recommendations tailored to your training schedule</span>
              </li>
              <li className="flex items-start text-white">
                <ChevronRight className="h-5 w-5 mr-2 text-blue-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Detailed recovery analytics and recommendations based on your biometric data</span>
              </li>
              <li className="flex items-start text-white">
                <ChevronRight className="h-5 w-5 mr-2 text-blue-300 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Unlimited training plan generations and race-specific preparation</span>
              </li>
            </ul>
            <Button onClick={() => setActiveTab("register")} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border-0">
              Start Your Running Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
