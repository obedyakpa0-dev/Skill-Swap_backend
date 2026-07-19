import * as sessionsService from '../services/sessions.service.js';

export async function bookSession(req, res) {
  const session = await sessionsService.bookSession(req.user.id, req.body);
  res.status(201).json(session);
}

export async function getSessionsForMatch(req, res) {
  const sessions = await sessionsService.getSessionsForMatch(req.params.matchId, req.user.id);
  res.status(200).json(sessions);
}

export async function completeSession(req, res) {
  const session = await sessionsService.completeSession(req.params.id, req.user.id);
  res.status(200).json(session);
}

export async function cancelSession(req, res) {
  const session = await sessionsService.cancelSession(req.params.id, req.user.id);
  res.status(200).json(session);
}

export async function generateRoomUrl(req, res) {
  const session = await sessionsService.generateRoomUrl(req.params.id, req.user.id);
  res.status(200).json(session);
}
