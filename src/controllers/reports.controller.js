import * as reportsService from '../services/reports.service.js';

export async function submitReport(req, res) {
  const report = await reportsService.submitReport(req.user.id, req.body);
  res.status(201).json(report);
}
