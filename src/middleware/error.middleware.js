/**
 * Catch-all error handler. Any controller that calls next(err) — or throws
 * inside an async handler wrapped with asyncHandler — lands here.
 * Keeping this in one place means controllers never need try/catch blocks
 * that just format an error response.
 */
export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;
  const message =status>= 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong on our end.': (err.message) || 'Something went wrong on our end.'

  res.status(status).json({ error: message });
}

/**
 * asyncHandler
 * Wraps an async route handler so any rejected promise / thrown error
 * is forwarded to next() instead of crashing the process.
 * Usage: router.get('/', asyncHandler(controllerFn))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
