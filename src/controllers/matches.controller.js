import * as matchesService from '../services/matches.service.js';

export async function getSuggestions(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const suggestions = await matchesService.getSuggestions(req.user.id, limit);
  res.status(200).json(suggestions);
}

export async function getMyMatches(req, res) {
  const matches = await matchesService.getMyMatches(req.user.id);
  res.status(200).json(matches);
}

export async function createMatchRequest(req, res) {
  const match = await matchesService.createMatchRequest(req.user.id, req.body);
  res.status(201).json(match);
}

export async function acceptMatch(req, res) {
  const match = await matchesService.acceptMatch(req.params.id, req.user.id);
  res.status(200).json(match);
}

export async function declineMatch(req, res) {
  const match = await matchesService.declineMatch(req.params.id, req.user.id);
  res.status(200).json(match);
}

export async function cancelMatch(req, res) {
  const match = await matchesService.cancelMatch(req.params.id, req.user.id);
  res.status(200).json(match);
}
