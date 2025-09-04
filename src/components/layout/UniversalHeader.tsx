import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Shield, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuthContext } from "@/components/AuthProvider";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UniversalHeaderProps {
  showSidebarTrigger?: boolean;
  sidebarTrigger?: React.ReactNode;
}

export function UniversalHeader({ showSidebarTrigger, sidebarTrigger }: UniversalHeaderProps) {
  const { isAdmin, loading } = useUserRole();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const handleViewToggle = () => {
    if (location.pathname.startsWith('/admin')) {
      navigate('/?view=user');
    } else {
      navigate('/admin');
    }
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const isInAdminView = location.pathname.startsWith('/admin');

  return (
    <header className="h-16 flex items-center justify-between border-b px-4 bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="flex items-center gap-4">
        {showSidebarTrigger && sidebarTrigger}
        <Logo variant="full" />
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isInAdminView && (
            <>
              <span>/</span>
              <Badge variant="secondary">Admin Panel</Badge>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Admin View Toggle */}
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewToggle}
            className="flex items-center gap-2"
          >
            {isInAdminView ? (
              <>
                <User className="h-4 w-4" />
                View as User
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Admin Panel
              </>
            )}
          </Button>
        )}

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{getUserDisplayName()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={handleViewToggle}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>{isInAdminView ? 'Switch to User View' : 'Switch to Admin View'}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be redirected to the login page and will need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}