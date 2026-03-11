import { requireAuth } from '../utils/auth';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const path = getRequestURL(event).pathname;

  // Only protect mutative methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return;
  }

  // Don't protect auth routes
  if (path.startsWith('/api/auth/')) {
    return;
  }

  // Don't protect non-API routes
  if (!path.startsWith('/api/')) {
    return;
  }

  // Require authentication for all other API mutations
  await requireAuth(event);
});
