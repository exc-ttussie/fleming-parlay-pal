import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Week } from '@/types/database';
import { toast } from 'sonner';
import { Calendar, Lock, Unlock, CheckCircle, Clock } from 'lucide-react';
import { getNextSundayLockTime, formatLockTime } from '@/lib/dateUtils';

export const WeekManagement = () => {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeeks = async () => {
    try {
      const { data, error } = await supabase
        .from('weeks')
        .select('*')
        .order('week_number', { ascending: true });

      if (error) throw error;
      setWeeks(data || []);
    } catch (error) {
      console.error('Error fetching weeks:', error);
      toast.error('Failed to fetch weeks');
    } finally {
      setLoading(false);
    }
  };

  const updateWeekStatus = async (weekId: string, newStatus: 'OPEN' | 'LOCKED' | 'FINALIZED') => {
    try {
      const { error } = await supabase
        .from('weeks')
        .update({ 
          status: newStatus,
          finalized_at: newStatus === 'FINALIZED' ? new Date().toISOString() : null
        })
        .eq('id', weekId);

      if (error) throw error;
      
      toast.success(`Week status updated to ${newStatus}`);
      fetchWeeks();
    } catch (error) {
      console.error('Error updating week status:', error);
      toast.error('Failed to update week status');
    }
  };

  const setDefaultLockTime = async (weekId: string) => {
    try {
      const nextSundayLock = getNextSundayLockTime();
      
      const { error } = await supabase
        .from('weeks')
        .update({ 
          locks_at: nextSundayLock.toISOString()
        })
        .eq('id', weekId);

      if (error) throw error;
      
      toast.success('Lock time set to next Sunday 12:00 PM ET');
      fetchWeeks();
    } catch (error) {
      console.error('Error updating lock time:', error);
      toast.error('Failed to update lock time');
    }
  };

  useEffect(() => {
    fetchWeeks();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      OPEN: 'default',
      LOCKED: 'secondary', 
      FINALIZED: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Week Management</h1>
      </div>

      <div className="grid gap-4">
        {weeks.map((week) => (
          <Card key={week.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Week {week.week_number}
                </CardTitle>
                {getStatusBadge(week.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Opens At</p>
                  <p>{new Date(week.opens_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Locks At</p>
                  <p>{formatLockTime(new Date(week.locks_at))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stake Amount</p>
                  <p>${(week.stake_amount / 100).toFixed(2)}</p>
                </div>
                {week.finalized_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Finalized At</p>
                    <p>{new Date(week.finalized_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setDefaultLockTime(week.id)}
                  variant="secondary"
                  size="sm"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Set Sunday 12PM ET
                </Button>
                
                {week.status === 'OPEN' && (
                  <Button
                    onClick={() => updateWeekStatus(week.id, 'LOCKED')}
                    variant="outline"
                    size="sm"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Week
                  </Button>
                )}
                {week.status === 'LOCKED' && (
                  <>
                    <Button
                      onClick={() => updateWeekStatus(week.id, 'OPEN')}
                      variant="outline"
                      size="sm"
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Reopen
                    </Button>
                    <Button
                      onClick={() => updateWeekStatus(week.id, 'FINALIZED')}
                      variant="default"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalize
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};