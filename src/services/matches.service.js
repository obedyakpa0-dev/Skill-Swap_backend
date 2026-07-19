import supabase from '../config/supabase.js';

/**
 * ── THE MATCHING ENGINE (blueprint 5.3) ─────────────────────────────────
 *
 * A match candidate exists when:
 *   User A teaches X   AND   User B teaches Y
 *   User A wants Y     AND   User B wants X
 *
 * i.e. it's reciprocal — each side gets something they want out of it.
 *
 * Scoring signals used to rank candidates (highest first):
 *   +10  exact skill_name match on both sides (X and Y both matched exactly)
 *   +4   category-only match (same category, different skill_name) — a
 *        weaker signal, still surfaced but ranked below exact matches
 *   +availabilityOverlapCount   (see overlapAvailability below)
 *   +schoolBonus (2 if same school — "optional preference, not a hard filter")
 *   +reputationBonus (candidate's reputation_score, 0-5 range, added directly
 *        so consistently well-rated users float upward as a tiebreaker)
 */

const EXACT_MATCH_SCORE = 10;
const CATEGORY_MATCH_SCORE = 4;
const SAME_SCHOOL_BONUS = 2;

function overlapAvailability(a, b) {
  // availability is stored as jsonb, expected shape: { monday: [...], tuesday: [...] }
  // We only score on overlapping day-keys here (not exact time-slot intersection) —
  // comparing precise time ranges is a good v2 improvement once availability's
  // time-slot format is finalized on the frontend.
  if (!a || !b) return 0;
  const daysA = Object.keys(a);
  const daysB = new Set(Object.keys(b));
  return daysA.filter((day) => daysB.has(day)).length;
}

/**
 * Returns ranked match suggestions for a user: other users who could swap
 * skills reciprocally with them.
 */
export async function getSuggestions(userId, limit = 20) {
  const { data: myProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('school, availability')
    .eq('id', userId)
    .single();
  if (profileErr) {
    const err = new Error('Profile not found.');
    err.status = 404;
    throw err;
  }

  const { data: mySkills, error: skillsErr } = await supabase
    .from('skills')
    .select('skill_name, category, direction')
    .eq('user_id', userId);
  if (skillsErr) {
    const err = new Error(skillsErr.message);
    err.status = 400;
    throw err;
  }

  const myOffered = mySkills.filter((s) => s.direction === 'offered');
  const myWanted = mySkills.filter((s) => s.direction === 'wanted');

  if (myOffered.length === 0 || myWanted.length === 0) {
    // Can't reciprocally match with nothing to offer or nothing to learn.
    return [];
  }

  // Already-matched or pending users are excluded so we don't resuggest them.
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('user1_id, user2_id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .in('status', ['pending', 'accepted', 'active']);

  const excludedIds = new Set([userId]);
  (existingMatches || []).forEach((m) => {
    excludedIds.add(m.user1_id === userId ? m.user2_id : m.user1_id);
  });

  // Candidates: anyone who OFFERS something I WANT.
  const wantedNames = myWanted.map((s) => s.skill_name);
  const { data: candidateSkillRows, error: candErr } = await supabase
    .from('skills')
    .select('user_id, skill_name, category, direction')
    .eq('direction', 'offered')
    .in('skill_name', wantedNames.length ? wantedNames : ['__none__']);
  if (candErr) {
    const err = new Error(candErr.message);
    err.status = 400;
    throw err;
  }

  const candidateIds = [...new Set(candidateSkillRows.map((r) => r.user_id))].filter(
    (id) => !excludedIds.has(id)
  );
  if (candidateIds.length === 0) return [];

  // Pull each candidate's full skill list + profile so we can check the
  // reverse direction (do they want something I offer?) and score them.
  const { data: candidateSkills } = await supabase
    .from('skills')
    .select('user_id, skill_name, category, direction')
    .in('user_id', candidateIds);

  const { data: candidateProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, school, avatar_url, verified, reputation_score, availability')
    .in('id', candidateIds);

  const profileById = Object.fromEntries((candidateProfiles || []).map((p) => [p.id, p]));

  const results = [];

  for (const candidateId of candidateIds) {
    const theirSkills = candidateSkills.filter((s) => s.user_id === candidateId);
    const theyOffer = theirSkills.filter((s) => s.direction === 'offered');
    const theyWant = theirSkills.filter((s) => s.direction === 'wanted');

    // Does what they want match anything I offer? (the reciprocal half)
    let bestReciprocal = null;
    for (const want of theyWant) {
      const exact = myOffered.find((o) => o.skill_name === want.skill_name);
      if (exact) {
        bestReciprocal = { skill: exact.skill_name, score: EXACT_MATCH_SCORE };
        break;
      }
      const sameCategory = myOffered.find((o) => o.category && o.category === want.category);
      if (sameCategory && !bestReciprocal) {
        bestReciprocal = { skill: sameCategory.skill_name, score: CATEGORY_MATCH_SCORE };
      }
    }

    if (!bestReciprocal) continue; // no reciprocal benefit — not a real match

    // What they offer that I want (for the response payload / score).
    let theirTeachMatch = theyOffer.find((o) => wantedNames.includes(o.skill_name));
    const theirTeachScore = theirTeachMatch ? EXACT_MATCH_SCORE : CATEGORY_MATCH_SCORE;
    if (!theirTeachMatch) theirTeachMatch = theyOffer[0];

    const profile = profileById[candidateId];
    if (!profile) continue;

    const availabilityScore = overlapAvailability(myProfile.availability, profile.availability);
    const schoolScore = myProfile.school && myProfile.school === profile.school ? SAME_SCHOOL_BONUS : 0;
    const reputationScore = profile.reputation_score || 0;

    const totalScore =
      bestReciprocal.score + theirTeachScore + availabilityScore + schoolScore + reputationScore;

    results.push({
      user: {
        id: profile.id,
        full_name: profile.full_name,
        school: profile.school,
        avatar_url: profile.avatar_url,
        verified: profile.verified,
        reputation_score: profile.reputation_score,
      },
      they_teach_you: theirTeachMatch.skill_name,
      you_teach_them: bestReciprocal.skill,
      score: totalScore,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export async function getMyMatches(userId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

export async function createMatchRequest(userId, { user2_id, user1_teaches, user2_teaches }) {
  if (!user2_id || !user1_teaches || !user2_teaches) {
    const err = new Error('user2_id, user1_teaches, and user2_teaches are required.');
    err.status = 400;
    throw err;
  }
  if (user2_id === userId) {
    const err = new Error('You cannot match with yourself.');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('matches')
    .insert({
      user1_id: userId,
      user2_id,
      user1_teaches,
      user2_teaches,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

async function getMatchOrThrow(matchId) {
  const { data, error } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (error || !data) {
    const err = new Error('Match not found.');
    err.status = 404;
    throw err;
  }
  return data;
}

function assertParticipant(match, userId) {
  if (match.user1_id !== userId && match.user2_id !== userId) {
    const err = new Error('You are not part of this match.');
    err.status = 403;
    throw err;
  }
}

async function setStatus(matchId, status) {
  const { data, error } = await supabase
    .from('matches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

export async function acceptMatch(matchId, userId) {
  const match = await getMatchOrThrow(matchId);
  // Only the recipient (user2) accepts a request they were sent.
  if (match.user2_id !== userId) {
    const err = new Error('Only the recipient can accept this match.');
    err.status = 403;
    throw err;
  }
  if (match.status !== 'pending') {
    const err = new Error(`Cannot accept a match with status "${match.status}".`);
    err.status = 400;
    throw err;
  }
  return setStatus(matchId, 'accepted');
}

export async function declineMatch(matchId, userId) {
  const match = await getMatchOrThrow(matchId);
  if (match.user2_id !== userId) {
    const err = new Error('Only the recipient can decline this match.');
    err.status = 403;
    throw err;
  }
  if (match.status !== 'pending') {
    const err = new Error(`Cannot decline a match with status "${match.status}".`);
    err.status = 400;
    throw err;
  }
  return setStatus(matchId, 'cancelled');
}

export async function cancelMatch(matchId, userId) {
  const match = await getMatchOrThrow(matchId);
  assertParticipant(match, userId);
  if (!['pending', 'accepted', 'active'].includes(match.status)) {
    const err = new Error(`Cannot cancel a match with status "${match.status}".`);
    err.status = 400;
    throw err;
  }
  return setStatus(matchId, 'cancelled');
}
