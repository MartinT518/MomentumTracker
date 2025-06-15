import { createContext, ReactNode, useContext, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/user-roles";

interface ImpersonationUser {
  id: number;
  username: string;
  role: UserRole;
  is_admin: boolean;
}

interface AdminImpersonationContextType {
  isImpersonating: boolean;
  impersonatedUser: ImpersonationUser | null;
  originalAdmin: ImpersonationUser | null;
  startImpersonation: (targetUserId: number) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AdminImpersonationContext = createContext<AdminImpersonationContextType | null>(null);

export function AdminImpersonationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonationUser | null>(null);
  const [originalAdmin, setOriginalAdmin] = useState<ImpersonationUser | null>(null);

  const startImpersonationMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      const response = await apiRequest('POST', '/api/admin/impersonate', { 
        targetUserId 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsImpersonating(true);
      setImpersonatedUser(data.impersonatedUser);
      setOriginalAdmin(data.originalAdmin);
      
      // Update the user query cache to reflect impersonated user
      queryClient.setQueryData(["/api/user"], data.impersonatedUser);
      
      toast({
        title: "Impersonation Started",
        description: `Now viewing as ${data.impersonatedUser.username} (${data.impersonatedUser.role})`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Impersonation Failed",
        description: error.message || "Failed to start impersonation",
        variant: "destructive",
      });
    },
  });

  const stopImpersonationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/stop-impersonate');
      return response.json();
    },
    onSuccess: (data) => {
      setIsImpersonating(false);
      setImpersonatedUser(null);
      setOriginalAdmin(null);
      
      // Restore original admin user in cache
      queryClient.setQueryData(["/api/user"], data.originalAdmin);
      
      // Invalidate all queries to refresh data for admin
      queryClient.invalidateQueries();
      
      toast({
        title: "Impersonation Ended",
        description: "Returned to admin view",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop impersonation",
        variant: "destructive",
      });
    },
  });

  const startImpersonation = async (targetUserId: number) => {
    await startImpersonationMutation.mutateAsync(targetUserId);
  };

  const stopImpersonation = async () => {
    await stopImpersonationMutation.mutateAsync();
  };

  const switchRole = (role: UserRole) => {
    if (impersonatedUser) {
      const updatedUser = { ...impersonatedUser, role };
      setImpersonatedUser(updatedUser);
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      toast({
        title: "Role Switched",
        description: `Viewing interface as ${role}`,
      });
    }
  };

  return (
    <AdminImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonatedUser,
        originalAdmin,
        startImpersonation,
        stopImpersonation,
        switchRole,
      }}
    >
      {children}
    </AdminImpersonationContext.Provider>
  );
}

export function useAdminImpersonation() {
  const context = useContext(AdminImpersonationContext);
  if (!context) {
    throw new Error("useAdminImpersonation must be used within an AdminImpersonationProvider");
  }
  return context;
}