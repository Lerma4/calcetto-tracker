export const usePermissions = () => {
  const { isLoggedIn } = useAuth();

  const canEdit = computed(() => isLoggedIn.value);
  const canCreate = computed(() => isLoggedIn.value);
  const canDelete = computed(() => isLoggedIn.value);

  return {
    canEdit,
    canCreate,
    canDelete,
  };
};
