import supabase from '../config/supabase.js';
import { createNotification } from './notifications.service.js';

async function getMatchAndAssertParticipant(matchId, userId) {
  const { data, error } = await supabase.from('matches').select('*').eq('id', matchId).single();
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

export async function bookSession(userId, { match_id, scheduled_at, duration_minutes, session_type }) {
  const match = await getMatchAndAssertParticipant(match_id, userId);

  if (!['accepted', 'active'].includes(match.status)) {
    const err = new Error('Sessions can only be booked for accepted or active matches.');
    err.status = 400;
    throw err;
  }
  if (!scheduled_at) {
    const err = new Error('scheduled_at is required.');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      match_id,
      scheduled_at,
      duration_minutes: duration_minutes || 60,
      session_type: session_type || 'text',
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }

  // Bump the match to 'active' once a session's actually on the books (5.3 state chain).
  if (match.status === 'accepted') {
    await supabase.from('matches').update({ status: 'active' }).eq('id', match_id);
  }

  const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
  await createNotification(otherUserId, {
    type: 'session_reminder',
    title: 'New session booked',
    body: `A session has been scheduled for ${new Date(scheduled_at).toLocaleString()}.`,
  });

  return data;
}

export async function getSessionsForMatch(matchId, userId) {
  await getMatchAndAssertParticipant(matchId, userId);

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('match_id', matchId)
    .order('scheduled_at', { ascending: true });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

async function getSessionOrThrow(sessionId) {
  const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
  if (error || !data) {
    const err = new Error('Session not found.');
    err.status = 404;
    throw err;
  }
  return data;
}

/**
 * Marks a session complete and prompts both participants for a review
 * (5.7 — "After every completed session, both users are prompted to
 * leave a review"). The actual review UI trigger lives on the frontend;
 * here we just fire the notification and flip status.
 */
export async function completeSession(sessionId, userId) {
  const session = await getSessionOrThrow(sessionId);
  const match = await getMatchAndAssertParticipant(session.match_id, userId);

  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }

  await Promise.all(
    [match.user1_id, match.user2_id].map((uid) =>
      createNotification(uid, {
        type: 'review_prompt',
        title: 'How did your session go?',
        body: 'Leave a review for your SkillSwap partner.',
      })
    )
  );

  return data;
}

export async function cancelSession(sessionId, userId) {
  const session = await getSessionOrThrow(sessionId);
  await getMatchAndAssertParticipant(session.match_id, userId);

  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'cancelled' })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

/**
 * Generates a video room URL for a session (8.6). The blueprint lists
 * Daily.co / Agora as TBD (tech stack table) — this stub returns a
 * placeholder so the route/contract is in place. Swap the body of this
 * function for a real Daily.co "create room" API call once a provider
 * is chosen; nothing else in the app needs to change.
 */
export async function generateRoomUrl(sessionId, userId) {
  const session = await getSessionOrThrow(sessionId);
  await getMatchAndAssertParticipant(session.match_id, userId);

  const placeholderUrl = `https://video.skillswap.app/room/${sessionId}`;

  const { data, error } = await supabase
    .from('sessions')
    .update({ room_url: placeholderUrl })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}
