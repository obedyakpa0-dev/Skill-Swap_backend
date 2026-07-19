import supabase from '../config/supabase.js';
import * as reportsService from './reports.service.js';

export async function getPendingVerifications() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, school, student_id_url, verification_status, created_at')
    .eq('verification_status', 'pending');

  if (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }
  return data;
}

export async function setVerificationStatus(userId, status) {
  if (!['verified', 'rejected', 'pending'].includes(status)) {
    const err = new Error("status must be 'verified', 'rejected', or 'pending'.");
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      verification_status: status,
      verified: status === 'verified',
    })
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

export async function getReports(status) {
  return reportsService.getAllReports(status);
}

export async function resolveReport(reportId, status) {
  return reportsService.updateReportStatus(reportId, status);
}
