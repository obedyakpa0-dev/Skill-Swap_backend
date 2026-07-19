import supabase from '../config/supabase.js';

export async function getMySkills(userId) {
  const { data, error } = await supabase
    .from('skills')
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

export async function addSkill(userId, { skill_name, category, direction, proficiency_level }) {
  if (!skill_name || !direction) {
    const err = new Error('skill_name and direction are required.');
    err.status = 400;
    throw err;
  }
  if (!['offered', 'wanted'].includes(direction)) {
    const err = new Error("direction must be 'offered' or 'wanted'.");
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('skills')
    .insert({ user_id: userId, skill_name, category, direction, proficiency_level })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

async function assertOwnsSkill(skillId, userId) {
  const { data, error } = await supabase
    .from('skills')
    .select('user_id')
    .eq('id', skillId)
    .single();

  if (error || !data) {
    const err = new Error('Skill not found.');
    err.status = 404;
    throw err;
  }
  if (data.user_id !== userId) {
    const err = new Error('You do not own this skill entry.');
    err.status = 403;
    throw err;
  }
}

export async function updateSkill(skillId, userId, updates) {
  await assertOwnsSkill(skillId, userId);

  const allowed = ['skill_name', 'category', 'direction', 'proficiency_level'];
  const safeUpdates = {};
  for (const field of allowed) {
    if (updates[field] !== undefined) safeUpdates[field] = updates[field];
  }

  const { data, error } = await supabase
    .from('skills')
    .update(safeUpdates)
    .eq('id', skillId)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

export async function deleteSkill(skillId, userId) {
  await assertOwnsSkill(skillId, userId);

  const { error } = await supabase.from('skills').delete().eq('id', skillId);
  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
}

/**
 * GET /skills/search?q=&category=
 * Platform-wide search (5.4) — matches skill_name (partial, case-insensitive)
 * and optionally filters by category. Joins in the owning profile's public
 * fields so the frontend can render "who teaches this" results directly.
 */
export async function searchSkills({ q, category }) {
  let query = supabase
    .from('skills')
    .select(
      `id, skill_name, category, direction, proficiency_level, user_id,
       profiles:user_id ( full_name, school, department, level, verified, reputation_score, avatar_url )`
    )
    .eq('direction', 'offered'); // searching finds people who can TEACH the skill

  if (q) query = query.ilike('skill_name', `%${q}%`);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}
