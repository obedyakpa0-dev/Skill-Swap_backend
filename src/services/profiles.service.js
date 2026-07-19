import supabase from '../config/supabase.js';

const AVATAR_BUCKET = 'avatars';
const STUDENT_ID_BUCKET = 'student-ids';

// Only these columns are safe for a user to edit about themselves.
// Anything not listed (verified, reputation_score, gamification_points,
// rank, verification_status) is admin/system-controlled and silently
// stripped out even if sent in the request body.
const EDITABLE_FIELDS = ['full_name', 'school', 'department', 'level', 'bio', 'availability'];

export async function getPublicProfile(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    const err = new Error('Profile not found.');
    err.status = 404;
    throw err;
  }
  return data;
}

export async function updateProfile(id, updates) {
  const safeUpdates = {};
  for (const field of EDITABLE_FIELDS) {
    if (updates[field] !== undefined) safeUpdates[field] = updates[field];
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

async function uploadImage(bucket, userId, file) {
  const ext = file.originalname.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

  if (uploadError) {
    const err = new Error(uploadError.message);
    err.status = 400;
    throw err;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId, file) {
  const url = await uploadImage(AVATAR_BUCKET, userId, file);

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId)
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
 * Student ID upload resets verification_status to 'pending' so it
 * re-enters the admin review queue (5.1 — "Admin reviews flagged/uncertain
 * cases manually"). Actual OCR/Veriff automation is a Phase 3 add-on
 * (webhook or edge function) — not implemented here, flagged as TODO.
 */
export async function uploadStudentId(userId, file) {
  const url = await uploadImage(STUDENT_ID_BUCKET, userId, file);

  const { data, error } = await supabase
    .from('profiles')
    .update({ student_id_url: url, verification_status: 'pending', verified: false })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }

  // TODO (Phase 3, section 5.1): trigger OCR/Veriff webhook here instead of
  // leaving every upload sitting in the manual admin queue.

  return data;
}
