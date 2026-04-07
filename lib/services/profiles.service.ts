import { supabase } from '@/lib/supabase';
import { Profile, UpdateProfileInput, PaginationParams, PaginatedResult } from '@/types';
import { APP_CONFIG } from '@/constants/config';

export async function getProfile(id: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getClients(
  params: PaginationParams = {}
): Promise<PaginatedResult<Profile>> {
  const { page = 1, pageSize = APP_CONFIG.pageSize, search } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'client')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
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

export async function updateProfile(id: string, input: UpdateProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const ext = uri.split('.').pop() ?? 'jpg';
  const fileName = `${userId}/avatar.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, blob, { upsert: true, contentType: `image/${ext}` });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function createClient(input: {
  full_name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  password: string;
}): Promise<Profile> {
  // Use Supabase Admin API via Edge Function to create the user
  // For now, use the standard signUp then update role
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { full_name: input.full_name } },
  });
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Failed to create user');

  // Update the auto-created profile with extra fields
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.full_name,
      phone: input.phone ?? null,
      photo_url: input.photo_url ?? null,
      role: 'client',
      updated_at: new Date().toISOString(),
    })
    .eq('id', authData.user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function setClientStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
