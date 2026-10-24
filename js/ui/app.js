import { createUserService } from '../domain/services/user-service.js';
import { createSpaceService } from '../domain/services/space-service.js';
import { createLocalStorageStore } from '../storage/repository.js';
import { createAuthController } from './controllers/auth-controller.js';
import { createSpaceController } from './controllers/space-controller.js';
import { createUserController } from './controllers/user-controller.js';
import { mountAppView, showAppError } from './views/app-view.js';

const root = document.getElementById('app');

try {
  const store = createLocalStorageStore(window.localStorage);
  const usersRepository = store.createRepository('usuarios');
  const userService = createUserService(usersRepository);
  const controller = createAuthController(userService);
  const spaceController = createSpaceController(
    createSpaceService(store.createRepository('espacios')),
    controller,
  );
  const userController = createUserController(userService, controller);
  mountAppView({
    root,
    controller,
    sessionStorage: window.sessionStorage,
    spaceController,
    userController,
  });
} catch (error) {
  showAppError(root, error instanceof Error ? error.message : String(error));
}
