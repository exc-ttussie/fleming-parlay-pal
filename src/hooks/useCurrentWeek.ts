import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Week } from '@/types/database';

interface WeekWithSeason extends Week {
  seasons?: {
    label: string;
  };
}

export const useCurrentWeek = () => {
  const [currentWeek, setCurrentWeek] = useState<WeekWithSeason | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentWeek = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date();
      
      // First try to find a week that matches current time constraints
      let { data: weeks, error } = await supabase
        .from('weeks')
        .select(`
          *,
          seasons:season_id (
            label
          )
        `)
        .eq('status', 'OPEN')
        .lte('opens_at', now.toISOString())
        .gt('locks_at', now.toISOString())
        .order('opens_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      // If no current week found, fall back to most recent OPEN week (for development)
      if (!weeks || weeks.length === 0) {
        const { data: fallbackWeeks, error: fallbackError } = await supabase
          .from('weeks')
          .select(`
            *,
            seasons:season_id (
              label
            )
          `)
          .eq('status', 'OPEN')
          .order('opens_at', { ascending: false })
          .limit(1);

        if (fallbackError) throw fallbackError;
        weeks = fallbackWeeks;
      }
      
      if (weeks && weeks.length > 0) {
        setCurrentWeek(weeks[0]);
      } else {
        setCurrentWeek(null);
      }
    } catch (error) {
      console.error('Error fetching current week:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch current week');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentWeek();
  }, []);

  return { currentWeek, loading, error, refetch: fetchCurrentWeek };
};