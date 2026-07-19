import * as skillsService from '../services/skills.service.js';

export async function getMySkills(req, res) {
  const skills = await skillsService.getMySkills(req.user.id);
  res.status(200).json(skills);
}

export async function addSkill(req, res) {
  const skill = await skillsService.addSkill(req.user.id, req.body);
  res.status(201).json(skill);
}

export async function updateSkill(req, res) {
  const skill = await skillsService.updateSkill(req.params.id, req.user.id, req.body);
  res.status(200).json(skill);
}

export async function deleteSkill(req, res) {
  await skillsService.deleteSkill(req.params.id, req.user.id);
  res.status(204).send();
}

export async function searchSkills(req, res) {
  const { q, category } = req.query;
  const results = await skillsService.searchSkills({ q, category });
  res.status(200).json(results);
}
