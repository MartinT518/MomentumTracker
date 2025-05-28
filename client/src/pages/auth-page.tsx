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
import { Loader2 } from "lucide-react";

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
      {/* Single column with form integrated into hero area */}
      <div className="w-full bg-gradient-to-br from-blue-900 to-indigo-900 p-4 md:p-8 flex flex-col justify-center min-h-screen overflow-y-auto">
        {/* Main top section with form */}
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto gap-8 items-start py-8">
          {/* Left side hero content */}
          <div className="lg:w-3/5">
            <div className="mb-6">
              <h1 className="text-5xl font-bold mb-4 text-white">Welcome Back</h1>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                Sign in to your AetherRun account and continue your training journey.
              </p>
            </div>
          </div>

          {/* Right side form content */}
          <div className="lg:w-2/5 lg:sticky lg:top-8">
            <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardContent className="pt-6">
                <div className="mb-6 text-center">
                  <h1 className="text-3xl font-bold mb-2 text-white">
                    <span className="text-blue-300">Aether</span>Run
                  </h1>
                  <p className="text-blue-200">Your AI-powered running companion</p>
                </div>

                <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="text-white">
                  <TabsList className="grid grid-cols-2 mb-6 bg-white/20 border border-white/40 rounded-md p-1">
                    <TabsTrigger 
                      value="login" 
                      className="data-[state=active]:bg-white/40 data-[state=active]:text-white data-[state=active]:font-bold data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white font-semibold transition-colors"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      className="data-[state=active]:bg-white/40 data-[state=active]:text-white data-[state=active]:font-bold data-[state=inactive]:text-white/70 data-[state=inactive]:hover:text-white font-semibold transition-colors"
                    >
                      Register
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem className="text-white">
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your username" {...field} className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem className="text-white">
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your password" {...field} className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
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
                      </form>
                    </Form>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-blue-200">
                        Don't have an account?{" "}
                        <button 
                          className="text-blue-300 hover:underline" 
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
                            <FormItem className="text-white">
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Choose a username" {...field} className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="text-white">
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email address" {...field} className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem className="text-white">
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Create a password" {...field} className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem className="text-white">
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm your password" {...field} className="bg-white/20 border-white/30 text-white placeholder:text-white/60" />
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
                      </form>
                    </Form>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-blue-200">
                        Already have an account?{" "}
                        <button 
                          className="text-blue-300 hover:underline" 
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
        </div>
      </div>
    </div>
  );
}
