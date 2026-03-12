export default defineNuxtRouteMiddleware(async (to) => {
  // Define public routes that don't require authentication
  const isPublic =
    to.path === '/login' ||
    to.path === '/tornei' ||
    to.path.startsWith('/tornei/');

  const { user, fetchUser } = useAuth();

  // Always attempt to fetch user if not already loaded
  // This ensures users with valid cookies are recognized even on public routes
  if (!user.value) {
    await fetchUser();
  }

  // Only redirect to login if route is NOT public AND user is not authenticated
  if (!isPublic && !user.value) {
    return navigateTo('/login');
  }
});
