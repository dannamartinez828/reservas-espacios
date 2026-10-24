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

test('USR-01 registra mediante el servicio y devuelve el usuario público', async () => {
  const { controller, usersRepository } = createController();
  const result = await controller.register({
    nombre: '  Ada Lovelace  ',
    correo: ' Ada@Example.edu ',
    password: 'correcta123',
  });

  assert.equal(result.ok, true);
  assert.equal(result.user.nombre, 'Ada Lovelace');
  assert.equal(result.user.correo, 'ada@example.edu');
  assert.equal(result.user.rol, 'SOLICITANTE');
  assert.equal(result.user.estado, 'ACTIVO');
  assert.equal(result.user.passwordHash, undefined);
  assert.notEqual(usersRepository.obtener(result.user.id).passwordHash, 'correcta123');
});

test('USR-01 muestra al usuario el error de duplicidad que devuelve el dominio', async () => {
  const { controller, usersRepository } = createController();
  const first = await controller.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });
  const second = await controller.register({
    nombre: 'Grace',
    correo: ' ADA@EXAMPLE.EDU ',
    password: 'otra123',
  });

  assert.equal(first.ok, true);
  assert.deepEqual(second, { ok: false, error: 'El correo ya está registrado.' });
  assert.equal(usersRepository.listar().length, 1);
});
