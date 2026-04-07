import { supabase } from '@/lib/supabase';
import {
  Subscription,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  PaginationParams,
  PaginatedResult,
} from '@/types';
import { APP_CONFIG } from '@/constants/config';

const SELECT_WITH_JOINS = `
  *,
  client:profiles!client_id(id, full_name, email, phone, photo_url, status),
  service:services!service_id(id, name, description, category, icon_url, status)
`;

export async function getSubscriptions(
  params: PaginationParams & { status?: 'active' | 'inactive' | 'all' } = {}
): Promise<PaginatedResult<Subscription>> {
  const { page = 1, pageSize = APP_CONFIG.pageSize, search, status = 'all' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('subscriptions')
    .select(SELECT_WITH_JOINS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > page * pageSize,
  };
}

export async function getClientSubscriptions(
  clientId: string,
  params: PaginationParams & { status?: 'active' | 'inactive' | 'all' } = {}
): Promise<PaginatedResult<Subscription>> {
  const { page = 1, pageSize = APP_CONFIG.pageSize, status = 'all' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('subscriptions')
    .select(SELECT_WITH_JOINS, { count: 'exact' })
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > page * pageSize,
  };
}

export async function getSubscription(id: string): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(SELECT_WITH_JOINS)
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createSubscription(
  input: CreateSubscriptionInput,
  createdBy: string
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      ...input,
      currency: input.currency ?? APP_CONFIG.defaultCurrency,
      created_by: createdBy,
    })
    .select(SELECT_WITH_JOINS)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSubscription(
  id: string,
  input: UpdateSubscriptionInput
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(SELECT_WITH_JOINS)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getExpiringSoon(days: number = APP_CONFIG.expiringThresholdDays): Promise<Subscription[]> {
  const future = new Date();
  future.setDate(future.getDate() + days);

  const { data, error } = await supabase
    .from('subscriptions')
    .select(SELECT_WITH_JOINS)
    .eq('status', 'active')
    .not('end_date', 'is', null)
    .lte('end_date', future.toISOString().split('T')[0])
    .gte('end_date', new Date().toISOString().split('T')[0])
    .order('end_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
