import { useAuth } from "@/hooks/use-auth";
import { Loader2, Shield } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if user has admin privileges
  if (user.role !== 'admin' && !user.is_admin) {
    return (
      <Route path={path}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 max-w-md">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <CardTitle className="text-white">Access Denied</CardTitle>
              <CardDescription className="text-white/70">
                Administrator privileges required to access this page
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}