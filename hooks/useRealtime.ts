import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuth } from '@/contexts/AuthContext';

export function useRealtimeNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications(user.id) });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.unreadCount(user.id) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}

export function useRealtimeSubscriptions() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats() });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
