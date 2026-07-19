import * as notificationsService from '../services/notifications.service.js';

export async function getMyNotifications(req, res) {
  const notifications = await notificationsService.getMyNotifications(req.user.id);
  res.status(200).json(notifications);
}

export async function markAsRead(req, res) {
  const notification = await notificationsService.markAsRead(req.params.id, req.user.id);
  res.status(200).json(notification);
}

export async function markAllAsRead(req, res) {
  const notifications = await notificationsService.markAllAsRead(req.user.id);
  res.status(200).json(notifications);
}
