import { supabase } from '@/lib/supabase';
import { PushNotification, SendNotificationInput, PaginationParams, PaginatedResult } from '@/types';
import { APP_CONFIG } from '@/constants/config';

// ─── DB Operations ────────────────────────────────────────────────────────────

export async function getMyNotifications(
  userId: string,
  params: PaginationParams = {}
): Promise<PaginatedResult<PushNotification>> {
  const { page = 1, pageSize = APP_CONFIG.pageSize } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('notification_recipients')
    .select(
      `
      id,
      read_at,
      created_at,
      notification:push_notifications!notification_id(
        id, title, body, data, target, created_at,
        sender:profiles!sent_by(id, full_name, photo_url)
      )
      `,
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const notifications: PushNotification[] = (data ?? []).map((r: any) => ({
    ...r.notification,
    is_read: !!r.read_at,
    read_at: r.read_at,
  }));

  return {
    data: notifications,
    count: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > page * pageSize,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notification_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notification_recipients')
    .update({ read_at: new Date().toISOString() })
    .eq('notification_id', notificationId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notification_recipients')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw new Error(error.message);
}

// ─── Send Notifications (Admin) ───────────────────────────────────────────────

export async function sendNotification(
  input: SendNotificationInput,
  sentBy: string
): Promise<void> {
  // 1. Insert into push_notifications
  const { data: notifData, error: notifError } = await supabase
    .from('push_notifications')
    .insert({
      title: input.title,
      body: input.body,
      data: input.data ?? {},
      target: input.target,
      sent_by: sentBy,
    })
    .select()
    .single();

  if (notifError) throw new Error(notifError.message);

  // 2. Determine recipients
  let recipientIds: string[] = [];

  if (input.target === 'all') {
    const { data: clients } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'client')
      .eq('status', 'active');
    recipientIds = (clients ?? []).map((c: { id: string }) => c.id);
  } else if (input.user_ids?.length) {
    recipientIds = input.user_ids;
  }

  // 3. Insert recipients
  if (recipientIds.length > 0) {
    const recipients = recipientIds.map((uid) => ({
      notification_id: notifData.id,
      user_id: uid,
    }));
    const { error: recError } = await supabase
      .from('notification_recipients')
      .insert(recipients);
    if (recError) throw new Error(recError.message);

    // 4. Get FCM tokens and dispatch via Supabase Edge Function
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', recipientIds);

    if (tokens && tokens.length > 0) {
      const { error: fnError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          tokens: tokens.map((t: { token: string }) => t.token),
          title: input.title,
          body: input.body,
          data: input.data ?? {},
        },
      });
      if (fnError) console.warn('Failed to dispatch FCM notifications:', fnError.message);
    }
  }
}

// ─── Push Token Management ────────────────────────────────────────────────────

export async function registerPushToken(userId: string, token: string, platform: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token, platform }, { onConflict: 'token' });
  if (error) throw new Error(error.message);
}

export async function removePushToken(token: string): Promise<void> {
  const { error } = await supabase.from('push_tokens').delete().eq('token', token);
  if (error) throw new Error(error.message);
}
