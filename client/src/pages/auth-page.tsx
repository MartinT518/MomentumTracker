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
    <div className="min-h-screen flex">
      {/* Single column layout to match screenshot */}
      <div className="w-full bg-blue-900 flex flex-col items-center min-h-screen overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-10">
          {/* Header section */}
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-3 text-white">Transform Your Running Journey</h1>
            <p className="text-lg text-blue-100 mb-8 mx-auto max-w-3xl">
              MomentumRun combines AI-powered training plans, advanced data integration, and intelligent health tracking to push your limits and achieve your running goals.
            </p>
          </div>

          {/* Tick marks and runner animation */}
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex justify-center space-x-2 mb-4">
              {Array(20).fill(0).map((_, i) => (
                <div key={i} className="h-6 w-0.5 bg-red-500" />
              ))}
            </div>
            
            <div className="mx-auto mb-2 relative w-full">
              <RunnerAnimation />
              
              <div className="absolute top-0 right-0 bg-black/80 text-white p-3 rounded-md text-sm">
                <div className="text-xs font-bold mb-1">AI INSIGHTS:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div>Pace:</div>
                  <div className="text-right">4.5 min/mi</div>
                  <div>Stride Length:</div>
                  <div className="text-right">10.5 ft</div>
                  <div>Form Efficiency:</div>
                  <div className="text-right">85%</div>
                </div>
              </div>
            </div>
            
            <div className="w-full h-1 bg-blue-950 rounded-full mb-8">
              <div className="h-full w-1/2 bg-gradient-to-r from-red-500 to-green-500 rounded-full"></div>
              <div className="flex justify-start mt-2">
                <div className="bg-red-500 px-2 py-1 rounded-sm text-white text-xs font-bold">
                  AI ENERGY ANALYSIS
                </div>
              </div>
            </div>
          </div>
          
          {/* Login/Registration form */}
          <div className="w-full max-w-lg mx-auto mb-6">
            <Card className="bg-blue-800/80 shadow-xl border-blue-700/30 text-center">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h2 className="text-3xl font-bold mb-1 text-blue-200">
                    Momentum<span className="text-white">Run</span>
                  </h2>
                  <p className="text-blue-100 text-sm">Your AI-powered running companion</p>
                </div>

                <div className="mb-4">
                  <div className="flex mb-2">
                    <Button
                      type="button"
                      className={`flex-1 ${activeTab === 'login' ? 'bg-blue-700 text-white' : 'bg-blue-900/50 text-blue-200'}`}
                      onClick={() => setActiveTab('login')}
                    >
                      Login
                    </Button>
                    <Button
                      type="button"
                      className={`flex-1 ${activeTab === 'register' ? 'bg-blue-700 text-white' : 'bg-blue-900/50 text-blue-200'}`}
                      onClick={() => setActiveTab('register')}
                    >
                      Register
                    </Button>
                  </div>
                </div>

                {activeTab === 'login' ? (
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="text-white text-left">
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} className="bg-blue-700/50 border-blue-600 text-white placeholder:text-blue-300/60" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="text-white text-left">
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} className="bg-blue-700/50 border-blue-600 text-white placeholder:text-blue-300/60" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-red-500 hover:bg-red-600 text-white border-0" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Login
                      </Button>
                      <div className="text-center">
                        <p className="text-sm text-blue-200">
                          Don't have an account?{" "}
                          <button 
                            type="button"
                            className="text-blue-300 hover:underline" 
                            onClick={() => setActiveTab("register")}
                          >
                            Register
                          </button>
                        </p>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="text-white text-left">
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} className="bg-blue-700/50 border-blue-600 text-white placeholder:text-blue-300/60" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="text-white text-left">
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email address" {...field} className="bg-blue-700/50 border-blue-600 text-white placeholder:text-blue-300/60" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="text-white text-left">
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a password" {...field} className="bg-blue-700/50 border-blue-600 text-white placeholder:text-blue-300/60" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem className="text-white text-left">
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} className="bg-blue-700/50 border-blue-600 text-white placeholder:text-blue-300/60" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-red-500 hover:bg-red-600 text-white border-0" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Register
                      </Button>
                      <div className="text-center">
                        <p className="text-sm text-blue-200">
                          Already have an account?{" "}
                          <button 
                            type="button"
                            className="text-blue-300 hover:underline" 
                            onClick={() => setActiveTab("login")}
                          >
                            Login
                          </button>
                        </p>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
            <div className="bg-blue-800/80 rounded-xl p-5 text-white">
              <div className="flex items-center mb-2">
                <div className="bg-blue-600 p-3 rounded-full mr-3">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">AI-Powered Training</h3>
              </div>
              <p className="text-sm text-blue-100">
                Personalized plans built by Google's Gemini AI that adapt to your performance.
              </p>
            </div>
            
            <div className="bg-blue-800/80 rounded-xl p-5 text-white">
              <div className="flex items-center mb-2">
                <div className="bg-purple-600 p-3 rounded-full mr-3">
                  <LineChart className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">Advanced Analytics</h3>
              </div>
              <p className="text-sm text-blue-100">
                Deep insights into pace, heart rate, and energy patterns.
              </p>
            </div>
            
            <div className="bg-blue-800/80 rounded-xl p-5 text-white">
              <div className="flex items-center mb-2">
                <div className="bg-indigo-600 p-3 rounded-full mr-3">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">Platform Integration</h3>
              </div>
              <p className="text-sm text-blue-100">
                Sync with Strava, Garmin Connect, and Polar seamlessly.
              </p>
            </div>
            
            <div className="bg-blue-800/80 rounded-xl p-5 text-white">
              <div className="flex items-center mb-2">
                <div className="bg-green-600 p-3 rounded-full mr-3">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">Health Intelligence</h3>
              </div>
              <p className="text-sm text-blue-100">
                Monitor energy levels calculated from HRV and sleep quality.
              </p>
            </div>
          </div>
          
          {/* Fitness integrations area */}
          <div className="w-full max-w-4xl mx-auto bg-black/40 rounded-xl p-4 text-white">
            <div className="flex justify-between mb-2">
              <h3 className="uppercase font-bold text-sm tracking-wider">FITNESS DEVICE INTEGRATIONS</h3>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs ml-1">CONNECTED</span>
              </div>
            </div>
            <FitnessIntegration />
          </div>
        </div>
      </div>
    </div>
  );
}
