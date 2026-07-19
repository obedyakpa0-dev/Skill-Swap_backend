import * as profilesService from '../services/profiles.service.js';

export async function getProfile(req, res) {
  const profile = await profilesService.getPublicProfile(req.params.id);
  res.status(200).json(profile);
}

export async function updateProfile(req, res) {
  const updated = await profilesService.updateProfile(req.params.id, req.body);
  res.status(200).json(updated);
}

export async function uploadAvatar(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const updated = await profilesService.uploadAvatar(req.params.id, req.file);
  res.status(200).json(updated);
}

export async function uploadStudentId(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const updated = await profilesService.uploadStudentId(req.params.id, req.file);
  res.status(200).json(updated);
}
