import supabase from '../config/supabase.js';

/**
 * Messaging (5.5 / 8.5): Express only persists messages to Postgres.
 * Real-time delivery is Supabase Realtime — the frontend subscribes to
 * postgres_changes on the `messages` table filtered by match_id, so a new
 * row inserted here is pushed to both participants instantly without
 * polling. This service has no delivery logic; it's just the write path.
 */

async function assertParticipant(matchId, userId) {
  const { data, error } = await supabase
    .from('matches')
    .select('user1_id, user2_id, status')
    .eq('id', matchId)
    .single();

  if (error || !data) {
    const err = new Error('Match not found.');
    err.status = 404;
    throw err;
  }
  if (data.user1_id !== userId && data.user2_id !== userId) {
    const err = new Error('You are not part of this match.');
    err.status = 403;
    throw err;
  }
  return data;
}

export async function getMessageHistory(matchId, userId) {
  await assertParticipant(matchId, userId);

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

export async function sendMessage(matchId, userId, { content, message_type = 'text' }) {
  await assertParticipant(matchId, userId);

  if (!content || !content.trim()) {
    const err = new Error('Message content cannot be empty.');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: userId, content, message_type })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

export async function markAsRead(matchId, userId) {
  await assertParticipant(matchId, userId);

  // Mark as read every message in this match NOT sent by me (i.e. the
  // other person's messages that I'm now viewing).
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .neq('sender_id', userId)
    .is('read_at', null)
    .select();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}
