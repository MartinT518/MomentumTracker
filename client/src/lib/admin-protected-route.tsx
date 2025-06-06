import { useAuth } from "@/hooks/use-auth";
import { Loader2, Crown } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

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

  if (!user.is_admin) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-800">
          <Card className="max-w-md mx-auto bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-8 text-center">
              <Crown className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
              <p className="text-white/80">
                You need administrator privileges to access this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </Route>
    );
  }

  return <Route path={path}><Component /></Route>;
}