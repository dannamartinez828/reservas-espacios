import { createUserService } from '../domain/services/user-service.js';
import { createLocalStorageStore } from '../storage/repository.js';
import { createAuthController } from './controllers/auth-controller.js';
import { mountAppView, showAppError } from './views/app-view.js';

const root = document.getElementById('app');

try {
  const store = createLocalStorageStore(window.localStorage);
  const usersRepository = store.createRepository('usuarios');
  const userService = createUserService(usersRepository);
  const controller = createAuthController(userService);
  mountAppView({
    root,
    controller,
    sessionStorage: window.sessionStorage,
  });
} catch (error) {
  showAppError(root, error instanceof Error ? error.message : String(error));
}
