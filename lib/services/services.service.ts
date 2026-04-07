import { supabase } from '@/lib/supabase';
import {
  Service,
  CreateServiceInput,
  UpdateServiceInput,
  PaginationParams,
  PaginatedResult,
} from '@/types';
import { APP_CONFIG } from '@/constants/config';

export async function getServices(
  params: PaginationParams & { status?: 'active' | 'inactive' | 'all' } = {}
): Promise<PaginatedResult<Service>> {
  const { page = 1, pageSize = APP_CONFIG.pageSize, search, status = 'all' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('services')
    .select('*, creator:profiles!created_by(id, full_name, email, photo_url)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
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

export async function getService(id: string): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .select('*, creator:profiles!created_by(id, full_name, email, photo_url)')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createService(
  input: CreateServiceInput,
  createdBy: string
): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .insert({
      ...input,
      currency: input.currency ?? APP_CONFIG.defaultCurrency,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateService(id: string, input: UpdateServiceInput): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleServiceStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<void> {
  const { error } = await supabase
    .from('services')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
