interface AuthUser {
  id: number;
  username: string;
  mustChangePassword?: boolean;
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth-user', () => null);
  const isLoggedIn = computed(() => !!user.value);
  const mustChangePassword = computed(() => !!user.value?.mustChangePassword);

  const fetchUser = async () => {
    try {
      const data = await $fetch<AuthUser>('/api/auth/me');
      user.value = data;
    } catch {
      user.value = null;
    }
  };

  const login = async (username: string, password: string) => {
    const data = await $fetch<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    user.value = data;
    return data;
  };

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' });
    user.value = null;
    navigateTo('/login');
  };

  return {
    user: readonly(user),
    isLoggedIn,
    mustChangePassword,
    fetchUser,
    login,
    logout,
  };
};
