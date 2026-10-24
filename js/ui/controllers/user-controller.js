function asFailure(error) {
  if (!(error instanceof Error)) {
    throw error;
  }
  return { ok: false, error: error.message };
}

export function createUserController(userService, authController) {
  if (!userService
    || typeof userService.list !== 'function'
    || typeof userService.setAccountStatus !== 'function'
    || !authController
    || typeof authController.getCurrentUser !== 'function') {
    throw new TypeError('Se requieren servicios válidos para administrar usuarios.');
  }

  function withActiveUser(userId, operation) {
    try {
      const currentUser = authController.getCurrentUser(userId);
      if (!currentUser.ok) {
        return currentUser;
      }
      return operation(currentUser.user);
    } catch (error) {
      return asFailure(error);
    }
  }

  return Object.freeze({
    list(userId) {
      return withActiveUser(userId, (actor) => ({
        ok: true,
        users: userService.list(actor),
      }));
    },

    setStatus(userId, targetUserId, status) {
      return withActiveUser(userId, (actor) => ({
        ok: true,
        user: userService.setAccountStatus(actor, targetUserId, status),
      }));
    },
  });
}
