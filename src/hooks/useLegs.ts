import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/AuthProvider';
import type { Leg } from '@/types/database';

interface LegWithProfile extends Leg {
  profiles?: {
    name: string;
  };
}

export const useLegs = (weekId: string | null) => {
  const { user } = useAuthContext();
  const [legs, setLegs] = useState<LegWithProfile[]>([]);
  const [userLeg, setUserLeg] = useState<LegWithProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLegs = async () => {
    if (!weekId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // First fetch legs
      const { data: legsData, error: legsError } = await supabase
        .from('legs')
        .select('*')
        .eq('week_id', weekId);

      if (legsError) throw legsError;

      // Then fetch profiles for the users
      const userIds = legsData?.map(leg => leg.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('safe_profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const legsWithProfiles = legsData?.map(leg => ({
        ...leg,
        profiles: profilesData?.find(profile => profile.user_id === leg.user_id) || { name: 'Unknown User' }
      })) || [];

      setLegs(legsWithProfiles);
      const myLeg = legsWithProfiles?.find(leg => leg.user_id === user?.id);
      setUserLeg(myLeg || null);
    } catch (error) {
      console.error('Error fetching legs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch legs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLegs();
  }, [weekId, user?.id]);

  return { legs, userLeg, loading, error, refetch: fetchLegs };
};