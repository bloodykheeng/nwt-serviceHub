import { supabase } from '@/lib/supabase';
import { LoginInput, RegisterInput } from '@/types';

export async function signIn({ email, password }: LoginInput) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signUp({ email, password, full_name, phone }: RegisterInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}
