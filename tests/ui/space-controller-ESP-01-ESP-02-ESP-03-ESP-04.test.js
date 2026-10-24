import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../../js/storage/repository.js';
import { createSpaceService } from '../../js/domain/services/space-service.js';
import { createUserService } from '../../js/domain/services/user-service.js';
import { createAuthController } from '../../js/ui/controllers/auth-controller.js';
import { createSpaceController } from '../../js/ui/controllers/space-controller.js';

async function createController() {
  const store = createMemoryStore();
  const spacesRepository = store.createRepository('espacios');
  const usersRepository = store.createRepository('usuarios');
  const spaceService = createSpaceService(spacesRepository);
  const userService = createUserService(usersRepository);
  const authController = createAuthController(userService);
  const admin = await userService.ensureSeedAdmin();
  const applicant = await userService.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });

  return {
    controller: createSpaceController(spaceService, authController),
    spacesRepository,
    usersRepository,
    admin,
    applicant,
  };
}

function validSpace(overrides = {}) {
  return {
    tipo: 'LABORATORIO',
    nombre: 'Laboratorio A',
    capacidad: 30,
    ubicacion: 'Bloque 1',
    ...overrides,
  };
}

test('ESP-01 el controlador crea y lista espacios mediante el servicio de dominio', async () => {
  const { controller, admin } = await createController();

  const created = controller.create(admin.id, validSpace());
  const listed = controller.list(admin.id);

  assert.equal(created.ok, true);
  assert.equal(created.space.estado, 'ACTIVO');
  assert.deepEqual(listed, { ok: true, spaces: [created.space] });
});

test('ESP-01 el controlador muestra los errores de validación del dominio', async () => {
  const { controller, admin, spacesRepository } = await createController();
  controller.create(admin.id, validSpace());

  const duplicate = controller.create(admin.id, validSpace({ nombre: 'laboratorio a' }));
  const invalid = controller.create(admin.id, validSpace({ capacidad: 0 }));

  assert.deepEqual(duplicate, {
    ok: false,
    error: 'El nombre del espacio ya está registrado.',
  });
  assert.deepEqual(invalid, {
    ok: false,
    error: 'La capacidad debe ser un entero mayor que cero.',
  });
  assert.equal(spacesRepository.listar().length, 1);
});

test('ESP-04 el controlador edita y actualiza la lista conservando estado e identificador', async () => {
  const { controller, admin } = await createController();
  const created = controller.create(admin.id, validSpace());
  controller.setStatus(admin.id, created.space.id, 'INACTIVO');

  const edited = controller.edit(admin.id, created.space.id, {
    nombre: 'Laboratorio B',
    capacidad: 40,
  });
  const listed = controller.list(admin.id);

  assert.equal(edited.ok, true);
  assert.equal(edited.space.id, created.space.id);
  assert.equal(edited.space.estado, 'INACTIVO');
  assert.equal(edited.space.nombre, 'Laboratorio B');
  assert.deepEqual(listed, { ok: true, spaces: [edited.space] });
});

test('ESP-02 el controlador activa y desactiva espacios y devuelve el estado actualizado', async () => {
  const { controller, admin } = await createController();
  const created = controller.create(admin.id, validSpace());

  const deactivated = controller.setStatus(admin.id, created.space.id, 'INACTIVO');
  const reactivated = controller.setStatus(admin.id, created.space.id, 'ACTIVO');

  assert.equal(deactivated.space.estado, 'INACTIVO');
  assert.equal(reactivated.space.estado, 'ACTIVO');
  assert.deepEqual(controller.list(admin.id), { ok: true, spaces: [reactivated.space] });
});

test('ESP-03 un SOLICITANTE no puede listar ni gestionar espacios desde el controlador', async () => {
  const { controller, admin, applicant, spacesRepository } = await createController();
  const created = controller.create(admin.id, validSpace());

  assert.match(controller.list(applicant.id).error, /permiso/i);
  assert.match(controller.create(applicant.id, validSpace({ nombre: 'Otro' })).error, /permiso/i);
  assert.match(controller.edit(applicant.id, created.space.id, { nombre: 'Cambiado' }).error, /permiso/i);
  assert.match(controller.setStatus(applicant.id, created.space.id, 'INACTIVO').error, /permiso/i);
  assert.equal(spacesRepository.listar().length, 1);
  assert.equal(spacesRepository.obtener(created.space.id).nombre, 'Laboratorio A');
});

test('ESP-03 una sesión de ADMIN inactivo no puede gestionar espacios', async () => {
  const { controller, admin, spacesRepository, usersRepository } = await createController();
  const session = controller.create(admin.id, validSpace());
  usersRepository.guardar({
    ...usersRepository.obtener(admin.id),
    estado: 'INACTIVO',
  });

  const result = controller.setStatus(admin.id, session.space.id, 'INACTIVO');
  assert.deepEqual(result, {
    ok: false,
    error: 'La cuenta del usuario no está activa.',
  });
});
