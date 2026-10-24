function asFailure(error) {
  if (!(error instanceof Error)) {
    throw error;
  }
  return { ok: false, error: error.message };
}

export function createAuthController(userService) {
  if (!userService
    || typeof userService.register !== 'function'
    || typeof userService.login !== 'function'
    || typeof userService.ensureSeedAdmin !== 'function'
    || typeof userService.getActiveUser !== 'function') {
    throw new TypeError('Se requiere un servicio de usuarios válido.');
  }

  return Object.freeze({
    async initialize() {
      try {
        return { ok: true, user: await userService.ensureSeedAdmin() };
      } catch (error) {
        return asFailure(error);
      }
    },

    async register(data) {
      try {
        return { ok: true, user: await userService.register(data) };
      } catch (error) {
        return asFailure(error);
      }
    },

    async login(credentials) {
      try {
        const user = await userService.login(credentials);
        return { ok: true, userId: user.id };
      } catch (error) {
        return asFailure(error);
      }
    },

    getCurrentUser(userId) {
      try {
        return { ok: true, user: userService.getActiveUser(userId) };
      } catch (error) {
        return asFailure(error);
      }
    },

    logout() {
      return { ok: true };
    },
  });
}
