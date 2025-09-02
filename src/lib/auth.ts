import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

export const signUp = async (email: string, password: string, name: string) => {
  try {
  const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: name,
        }
      }
    });
    
    if (error) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
      return { data, error };
    }
    
    toast({
      title: "Success",
      description: "Account created successfully! You can now sign in.",
    });
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Sign up error:', error);
    toast({
      title: "Sign Up Error", 
      description: "An unexpected error occurred during sign up",
      variant: "destructive",
    });
    return { data: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
      return { data, error };
    }
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error);
    toast({
      title: "Sign In Error", 
      description: "An unexpected error occurred during sign in",
      variant: "destructive",
    });
    return { data: null, error };
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