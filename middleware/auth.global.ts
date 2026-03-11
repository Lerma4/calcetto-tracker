export default defineNuxtRouteMiddleware(async (to) => {
  // Don't guard the login page itself
  if (to.path === '/login') {
    return;
  }

  const { user, fetchUser } = useAuth();

  // If we don't have user data yet, try to fetch it
  if (!user.value) {
    await fetchUser();
  }

  // If still not authenticated, redirect to login
  if (!user.value) {
    return navigateTo('/login');
  }
});
