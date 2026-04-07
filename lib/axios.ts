import axios from 'axios';
import { supabase } from './supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;

// Axios instance pointing at Supabase REST API (used for custom endpoints / Edge Functions)
export const api = axios.create({
  baseURL: `${supabaseUrl}/functions/v1`,
  headers: {
    'Content-Type': 'application/json',
    apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  },
  timeout: 15000,
});

// Attach auth token on every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? 'An error occurred';
    return Promise.reject(new Error(message));
  }
);
