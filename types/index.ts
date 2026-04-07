// ─── Enums / Unions ──────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'client';
export type ActiveStatus = 'active' | 'inactive';
export type NotificationTarget = 'all' | 'specific';
export type ColorScheme = 'light' | 'dark';

// ─── Database Models ──────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  role: UserRole;
  status: ActiveStatus;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  currency: string;
  status: ActiveStatus;
  icon_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  creator?: Profile;
}

export interface Subscription {
  id: string;
  client_id: string;
  service_id: string;
  start_date: string;
  end_date: string | null;
  description: string | null;
  price: number;
  currency: string;
  status: ActiveStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  client?: Profile;
  service?: Service;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  target: NotificationTarget;
  sent_by: string | null;
  created_at: string;
  // joined
  sender?: Profile;
  is_read?: boolean;
  read_at?: string | null;
}

export interface NotificationRecipient {
  id: string;
  notification_id: string;
  user_id: string;
  read_at: string | null;
  created_at: string;
  notification?: PushNotification;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: string | null;
  created_at: string;
}

// ─── Dashboard / Stats ────────────────────────────────────────────────────────

export interface DashboardStats {
  total_clients: number;
  total_services: number;
  active_subscriptions: number;
  inactive_subscriptions: number;
  total_revenue: number;
  expiring_soon: number; // subscriptions expiring in next 7 days
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

// ─── Form Inputs ──────────────────────────────────────────────────────────────

export interface CreateServiceInput {
  name: string;
  description?: string;
  category?: string;
  price: number;
  currency?: string;
  status: ActiveStatus;
  icon_url?: string;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

export interface CreateSubscriptionInput {
  client_id: string;
  service_id: string;
  start_date: string;
  end_date?: string;
  description?: string;
  price: number;
  currency?: string;
  status: ActiveStatus;
}

export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput>;

export interface CreateClientInput {
  full_name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  password: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  photo_url?: string;
}

export interface SendNotificationInput {
  title: string;
  body: string;
  target: NotificationTarget;
  user_ids?: string[];
  data?: Record<string, unknown>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  tabBar: string;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  placeholder: string;
  inputBg: string;
  overlay: string;
}
