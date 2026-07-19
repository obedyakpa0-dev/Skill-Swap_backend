import supabase from '../config/supabase.js';

/**
 * Internal helper used by other services (sessions, matches) to fire a
 * notification row. Not exposed as its own route — notifications are a
 * side effect of other actions, not something a user creates directly.
 */
export async function createNotification(userId, { type, title, body }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, body })
    .select()
    .single();

  if (error) {
    // Notifications are a nice-to-have side effect — log but don't blow up
    // the parent action (e.g. booking a session) just because this failed.
    console.error('Failed to create notification:', error.message);
    return null;
  }
  return data;
}

export async function getMyNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

export async function markAsRead(notificationId, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId) // can only mark your own notifications read
    .select()
    .single();

  if (error || !data) {
    const err = new Error('Notification not found.');
    err.status = 404;
    throw err;
  }
  return data;
}

export async function markAllAsRead(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
    .select();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}
