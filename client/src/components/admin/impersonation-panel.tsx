import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminImpersonation } from "@/hooks/use-admin-impersonation";
import { Users, Eye, EyeOff, Search, UserCheck, Crown } from "lucide-react";
import { UserRole } from "@shared/user-roles";

interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  subscription_status: string;
}

export function ImpersonationPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  
  const { 
    isImpersonating, 
    impersonatedUser, 
    originalAdmin,
    startImpersonation, 
    stopImpersonation,
    switchRole 
  } = useAdminImpersonation();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["/api/admin/users", page, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: searchTerm
      });
      const response = await fetch(`/api/admin/users?${params}`);
      return response.json();
    },
  });

  const handleImpersonate = async (userId: number) => {
    try {
      await startImpersonation(userId);
    } catch (error) {
      console.error("Failed to start impersonation:", error);
    }
  };

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonation();
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'coach': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Impersonation Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isImpersonating && impersonatedUser && (
          <Alert className="bg-yellow-500/20 border-yellow-500/30">
            <Eye className="h-4 w-4" />
            <AlertDescription className="text-white">
              <div className="flex items-center justify-between">
                <div>
                  Currently viewing as: <strong>{impersonatedUser.username}</strong> ({impersonatedUser.role})
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => switchRole('user')}
                    disabled={impersonatedUser.role === 'user'}
                    className="text-xs"
                  >
                    View as User
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => switchRole('coach')}
                    disabled={impersonatedUser.role === 'coach'}
                    className="text-xs"
                  >
                    View as Coach
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleStopImpersonation}
                    className="text-xs"
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-4 text-white/70">Loading users...</div>
        ) : (
          <div className="space-y-2">
            {usersData?.users?.map((user: User) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {user.is_admin && <Crown className="h-4 w-4 text-yellow-400" />}
                    <UserCheck className="h-4 w-4 text-white/70" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{user.username}</div>
                    <div className="text-white/60 text-sm">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </Badge>
                  
                  {user.subscription_status === 'active' && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                      Premium
                    </Badge>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleImpersonate(user.id)}
                    disabled={user.is_admin || isImpersonating}
                    className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Impersonate
                  </Button>
                </div>
              </div>
            ))}
            
            {usersData?.users?.length === 0 && (
              <div className="text-center py-4 text-white/70">
                No users found matching your search.
              </div>
            )}
          </div>
        )}

        {usersData?.pagination && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-white/70 text-sm">
              Page {usersData.pagination.page} of {usersData.pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= usersData.pagination.totalPages}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}