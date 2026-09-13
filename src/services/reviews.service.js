import supabase from '../config/supabase.js';

/**
 * After inserting a review, recalculate the reviewee's reputation_score
 * (5.2 — "average rating from past sessions") as a straight average of all
 * ratings ever received. Also nudges gamification_points (5.8) — since the
 * blueprint doesn't specify exact point values, this uses a small flat
 * award per review received; tune the constant once game design is final.
 */
const POINTS_PER_REVIEW_RECEIVED = 5;

async function recalculateReputation(revieweeId) {
  const { data: ratings, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', revieweeId);

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }

  const avg =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

  const { data: profile } = await supabase
    .from('profiles')
    .select('gamification_points')
    .eq('id', revieweeId)
    .single();

  const newPoints = (profile?.gamification_points || 0) + POINTS_PER_REVIEW_RECEIVED;
  const newRank = rankForPoints(newPoints);

  await supabase
    .from('profiles')
    .update({
      reputation_score: Number(avg.toFixed(2)),
      gamification_points: newPoints,
      rank: newRank,
    })
    .eq('id', revieweeId);

  // 5.7: "Users with consistently low ratings may be flagged for admin review."
  // Left as a TODO — needs an admin-facing flag/threshold decision, not just
  // a silent score update.
}

function rankForPoints(points) {
  // Placeholder thresholds — the blueprint (5.8) names the tiers but not
  // the point thresholds between them. Adjust once game design is set.
  if (points >= 500) return 'SkillSwap Champion';
  if (points >= 200) return 'Gold Mentor';
  if (points >= 50) return 'Silver Mentor';
  return 'Bronze Mentor';
}

export async function submitReview(reviewerId, {
  session_id,
  reviewee_id,
  rating,
  was_respectful,
  did_show_up,
  would_swap_again,
  comment,
}) {
  if (!session_id || !reviewee_id || !rating) {
    const err = new Error('session_id, reviewee_id, and rating are required.');
    err.status = 400;
    throw err;
  }
  if (rating < 1 || rating > 5) {
    const err = new Error('rating must be between 1 and 5.');
    err.status = 400;
    throw err;
  }
  if (reviewee_id === reviewerId) {
    const err = new Error('You cannot review yourself.');
    err.status = 400;
    throw err;
  }

  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('id, status, match_id, matches:match_id ( user1_id, user2_id )')
    .eq('id', session_id)
    .single();

  if (sessionErr || !session) {
    const err = new Error('Session not found.');
    err.status = 404;
    throw err;
  }
  if (session.status !== 'completed') {
    const err = new Error('You can only review completed sessions.');
    err.status = 400;
    throw err;
  }

  const { user1_id, user2_id } = session.matches;
  if (![user1_id, user2_id].includes(reviewerId)) {
    const err = new Error('You were not part of this session.');
    err.status = 403;
    throw err;
  }

  const actualReviewedId = user1_id === reviewerId ? user1_id : user2_id;
  if (reviewee_id !== actualReviewedId) {
    const err = new Error('reviewee_id does not match the other participant in this session.')
    err.status = 400;
    throw err;
  }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('session_id', session_id)
    .eq('reviewer_id', reviewerId)
    .maybeSingle();

  if (existing) {
    const err = new Error('You already reviewed this session.');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      session_id,
      reviewer_id: reviewerId,
      reviewee_id,
      rating,
      was_respectful,
      did_show_up,
      would_swap_again,
      comment,
    })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }

  await recalculateReputation(reviewee_id);

  return data;
}

export async function getReviewsForUser(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}
