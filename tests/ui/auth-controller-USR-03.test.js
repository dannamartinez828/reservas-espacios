import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../../js/storage/repository.js';
import { createUserService } from '../../js/domain/services/user-service.js';
import { createAuthController } from '../../js/ui/controllers/auth-controller.js';

test('USR-03 inicializa el administrador semilla de forma idempotente', async () => {
  const store = createMemoryStore();
  const usersRepository = store.createRepository('usuarios');
  const userService = createUserService(usersRepository);
  const controller = createAuthController(userService);

  const first = await controller.initialize();
  const second = await controller.initialize();

  assert.equal(first.ok, true);
  assert.equal(first.user.correo, 'admin@uninpahu.edu');
  assert.equal(first.user.rol, 'ADMIN');
  assert.equal(first.user.estado, 'ACTIVO');
  assert.equal(second.user.id, first.user.id);
  assert.equal(usersRepository.listar().length, 1);
  assert.match(usersRepository.obtener(first.user.id).passwordHash, /^pbkdf2-sha256\$/);
});
