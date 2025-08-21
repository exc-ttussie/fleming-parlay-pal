import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

export const signInWithGoogle = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    
    if (error) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Auth error:', error);
    toast({
      title: "Authentication Error", 
      description: "An unexpected error occurred during sign in",
      variant: "destructive",
    });
    return { error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
    return { error };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error };
  }
};