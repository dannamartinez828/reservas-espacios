import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../../js/storage/repository.js';
import { createUserService } from '../../js/domain/services/user-service.js';
import { createAuthController } from '../../js/ui/controllers/auth-controller.js';
import { createUserController } from '../../js/ui/controllers/user-controller.js';

async function createController() {
  const store = createMemoryStore();
  const usersRepository = store.createRepository('usuarios');
  const userService = createUserService(usersRepository);
  const authController = createAuthController(userService);
  const admin = await userService.ensureSeedAdmin();
  const applicant = await userService.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });

  return {
    controller: createUserController(userService, authController),
    usersRepository,
    admin,
    applicant,
  };
}

test('USR-04 el controlador lista usuarios sin exponer hashes ni contraseñas', async () => {
  const { controller, admin, applicant } = await createController();

  const result = controller.list(admin.id);

  assert.equal(result.ok, true);
  assert.deepEqual(result.users.map(({ nombre, correo, rol, estado }) => ({
    nombre,
    correo,
    rol,
    estado,
  })), [
    {
      nombre: 'Administrador',
      correo: 'admin@uninpahu.edu',
      rol: 'ADMIN',
      estado: 'ACTIVO',
    },
    {
      nombre: 'Ada',
      correo: 'ada@example.edu',
      rol: 'SOLICITANTE',
      estado: 'ACTIVO',
    },
  ]);
  assert.equal(result.users.some((user) => 'passwordHash' in user), false);
  assert.equal(result.users.some((user) => 'password' in user), false);
  assert.equal(result.users.some((user) => user.id === applicant.id), true);
});

test('USR-04 el controlador activa y desactiva cuentas y devuelve la lista actualizada', async () => {
  const { controller, admin, applicant } = await createController();

  const deactivated = controller.setStatus(admin.id, applicant.id, 'INACTIVO');
  const afterDeactivation = controller.list(admin.id);
  const reactivated = controller.setStatus(admin.id, applicant.id, 'ACTIVO');
  const afterReactivation = controller.list(admin.id);

  assert.equal(deactivated.user.estado, 'INACTIVO');
  assert.equal(afterDeactivation.users.find((user) => user.id === applicant.id).estado, 'INACTIVO');
  assert.equal(reactivated.user.estado, 'ACTIVO');
  assert.equal(afterReactivation.users.find((user) => user.id === applicant.id).estado, 'ACTIVO');
});

test('USR-04 el controlador muestra el error del dominio para estados inválidos', async () => {
  const { controller, admin, applicant, usersRepository } = await createController();
  const before = usersRepository.obtener(applicant.id);

  const result = controller.setStatus(admin.id, applicant.id, 'PENDIENTE');

  assert.deepEqual(result, {
    ok: false,
    error: 'El estado de la cuenta no es válido.',
  });
  assert.deepEqual(usersRepository.obtener(applicant.id), before);
});

test('ROL-01 un SOLICITANTE no puede listar ni cambiar estados de usuarios', async () => {
  const { controller, applicant, admin, usersRepository } = await createController();
  const before = usersRepository.listar();

  assert.match(controller.list(applicant.id).error, /permiso/i);
  assert.match(controller.setStatus(applicant.id, admin.id, 'INACTIVO').error, /permiso/i);
  assert.deepEqual(usersRepository.listar(), before);
});

test('ROL-01 una sesión de ADMIN inactivo no puede gestionar usuarios', async () => {
  const { controller, admin, usersRepository } = await createController();
  usersRepository.guardar({ ...usersRepository.obtener(admin.id), estado: 'INACTIVO' });

  assert.deepEqual(controller.list(admin.id), {
    ok: false,
    error: 'La cuenta del usuario no está activa.',
  });
  assert.deepEqual(controller.setStatus(admin.id, admin.id, 'ACTIVO'), {
    ok: false,
    error: 'La cuenta del usuario no está activa.',
  });
});
