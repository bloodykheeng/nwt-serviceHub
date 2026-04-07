export const QUERY_KEYS = {
  // Auth / Profile
  profile: (id: string) => ['profile', id] as const,
  profiles: (filters?: object) => ['profiles', filters] as const,

  // Services
  services: (filters?: object) => ['services', filters] as const,
  service: (id: string) => ['service', id] as const,

  // Subscriptions
  subscriptions: (filters?: object) => ['subscriptions', filters] as const,
  subscription: (id: string) => ['subscription', id] as const,
  clientSubscriptions: (clientId: string, filters?: object) =>
    ['subscriptions', 'client', clientId, filters] as const,

  // Notifications
  notifications: (userId: string, filters?: object) =>
    ['notifications', userId, filters] as const,
  unreadCount: (userId: string) => ['notifications', 'unread', userId] as const,

  // Stats
  stats: () => ['stats'] as const,
} as const;
