import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';

export const useUserRole = () => {
  const { user } = useAuthContext();
  const [role, setRole] = useState<'MEMBER' | 'COMMISSIONER' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setRole(profile?.role || 'MEMBER');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('MEMBER');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, loading, isAdmin: role === 'COMMISSIONER' };
};