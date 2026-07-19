import supabase from '../config/supabase.js';

export async function submitReport(reporterId, { reported_user_id, reason, details }) {
  if (!reported_user_id || !reason) {
    const err = new Error('reported_user_id and reason are required.');
    err.status = 400;
    throw err;
  }
  if (reported_user_id === reporterId) {
    const err = new Error('You cannot report yourself.');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('reports')
    .insert({ reporter_id: reporterId, reported_user_id, reason, details, status: 'open' })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

/** Used by admin.service.js — not exposed to regular users directly. */
export async function getAllReports(status) {
  let query = supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

export async function updateReportStatus(reportId, status) {
  if (!['open', 'reviewed', 'dismissed'].includes(status)) {
    const err = new Error("status must be 'open', 'reviewed', or 'dismissed'.");
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}
