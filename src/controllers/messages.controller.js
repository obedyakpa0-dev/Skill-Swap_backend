import * as messagesService from '../services/messages.service.js';

export async function getHistory(req, res) {
  const messages = await messagesService.getMessageHistory(req.params.matchId, req.user.id);
  res.status(200).json(messages);
}

export async function sendMessage(req, res) {
  const message = await messagesService.sendMessage(req.params.matchId, req.user.id, req.body);
  res.status(201).json(message);
}

export async function markAsRead(req, res) {
  const updated = await messagesService.markAsRead(req.params.matchId, req.user.id);
  res.status(200).json(updated);
}
