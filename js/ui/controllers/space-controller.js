function asFailure(error) {
  if (!(error instanceof Error)) {
    throw error;
  }
  return { ok: false, error: error.message };
}

export function createSpaceController(spaceService, authController) {
  if (!spaceService
    || typeof spaceService.list !== 'function'
    || typeof spaceService.create !== 'function'
    || typeof spaceService.edit !== 'function'
    || typeof spaceService.setStatus !== 'function'
    || !authController
    || typeof authController.getCurrentUser !== 'function') {
    throw new TypeError('Se requieren servicios válidos para administrar espacios.');
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
        spaces: spaceService.list(actor),
      }));
    },

    create(userId, data) {
      return withActiveUser(userId, (actor) => ({
        ok: true,
        space: spaceService.create(actor, data),
      }));
    },

    edit(userId, spaceId, changes) {
      return withActiveUser(userId, (actor) => ({
        ok: true,
        space: spaceService.edit(actor, spaceId, changes),
      }));
    },

    setStatus(userId, spaceId, status) {
      return withActiveUser(userId, (actor) => ({
        ok: true,
        space: spaceService.setStatus(actor, spaceId, status),
      }));
    },
  });
}
