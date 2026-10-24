import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../../js/storage/repository.js';
import { createUserService } from '../../js/domain/services/user-service.js';
import { createAuthController } from '../../js/ui/controllers/auth-controller.js';

function createController() {
  const store = createMemoryStore();
  const usersRepository = store.createRepository('usuarios');
  const userService = createUserService(usersRepository);
  return { controller: createAuthController(userService), usersRepository };
}

test('USR-02 inicia sesión y entrega solo el id para conservarlo como sesión', async () => {
  const { controller, usersRepository } = createController();
  await controller.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });

  const result = await controller.login({
    correo: ' ADA@EXAMPLE.EDU ',
    password: 'correcta123',
  });

  assert.deepEqual(result, {
    ok: true,
    userId: usersRepository.listar()[0].id,
  });
  assert.equal('password' in result, false);
  assert.equal('passwordHash' in result, false);
});

test('USR-02 devuelve los errores de credenciales del dominio', async () => {
  const { controller } = createController();
  const result = await controller.login({
    correo: 'nadie@example.edu',
    password: 'incorrecta',
  });

  assert.deepEqual(result, { ok: false, error: 'Credenciales incorrectas.' });
});

test('USR-02 vuelve a consultar la cuenta y deniega una sesión desactivada', async () => {
  const { controller, usersRepository } = createController();
  const registered = await controller.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });
  const login = await controller.login({
    correo: 'ada@example.edu',
    password: 'correcta123',
  });
  usersRepository.guardar({
    ...usersRepository.obtener(registered.user.id),
    estado: 'INACTIVO',
  });

  const result = controller.getCurrentUser(login.userId);
  assert.deepEqual(result, {
    ok: false,
    error: 'La cuenta del usuario no está activa.',
  });
});

test('USR-02 cerrar sesión no devuelve ni conserva credenciales', () => {
  const { controller } = createController();

  assert.deepEqual(controller.logout(), { ok: true });
});
