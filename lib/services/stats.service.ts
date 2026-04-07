import { supabase } from '@/lib/supabase';
import { DashboardStats } from '@/types';
import { APP_CONFIG } from '@/constants/config';

export async function getDashboardStats(): Promise<DashboardStats> {
  const future = new Date();
  future.setDate(future.getDate() + APP_CONFIG.expiringThresholdDays);
  const futureStr = future.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const [
    { count: total_clients },
    { count: total_services },
    { count: active_subscriptions },
    { count: inactive_subscriptions },
    { count: expiring_soon },
    { data: revenueData },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .eq('status', 'active'),
    supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'inactive'),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('end_date', 'is', null)
      .lte('end_date', futureStr)
      .gte('end_date', todayStr),
    supabase
      .from('subscriptions')
      .select('price')
      .eq('status', 'active'),
  ]);

  const total_revenue = (revenueData ?? []).reduce(
    (sum: number, s: { price: number }) => sum + (s.price ?? 0),
    0
  );

  return {
    total_clients: total_clients ?? 0,
    total_services: total_services ?? 0,
    active_subscriptions: active_subscriptions ?? 0,
    inactive_subscriptions: inactive_subscriptions ?? 0,
    total_revenue,
    expiring_soon: expiring_soon ?? 0,
  };
}
