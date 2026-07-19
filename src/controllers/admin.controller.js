import * as adminService from '../services/admin.service.js';

export async function getPendingVerifications(req, res) {
  const profiles = await adminService.getPendingVerifications();
  res.status(200).json(profiles);
}

export async function setVerificationStatus(req, res) {
  const { status } = req.body;
  const profile = await adminService.setVerificationStatus(req.params.id, status);
  res.status(200).json(profile);
}

export async function getReports(req, res) {
  const reports = await adminService.getReports(req.query.status);
  res.status(200).json(reports);
}

export async function resolveReport(req, res) {
  const { status } = req.body;
  const report = await adminService.resolveReport(req.params.id, status);
  res.status(200).json(report);
}
