import * as reviewsService from '../services/reviews.service.js';

export async function submitReview(req, res) {
  const review = await reviewsService.submitReview(req.user.id, req.body);
  res.status(201).json(review);
}

export async function getReviewsForUser(req, res) {
  const reviews = await reviewsService.getReviewsForUser(req.params.id);
  res.status(200).json(reviews);
}
