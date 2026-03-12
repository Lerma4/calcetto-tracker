export default defineNuxtRouteMiddleware(async (to) => {
  // Define public routes that don't require authentication
  const isPublic =
    to.path === '/login' ||
    to.path === '/tornei' ||
    to.path.startsWith('/tornei/');

  const { user, fetchUser, mustChangePassword } = useAuth();

  // Always attempt to fetch user if not already loaded
  // This ensures users with valid cookies are recognized even on public routes
  if (!user.value) {
    await fetchUser();
  }

  // If user must change password, force redirect to /change-password
  if (user.value && mustChangePassword.value && to.path !== '/change-password') {
    return navigateTo('/change-password');
  }

  // Only redirect to login if route is NOT public AND user is not authenticated
  if (!isPublic && !user.value) {
    return navigateTo('/login');
  }
});
