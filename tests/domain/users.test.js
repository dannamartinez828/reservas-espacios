import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../../js/storage/repository.js';
import { createUserService } from '../../js/domain/services/user-service.js';

function createService() {
  const store = createMemoryStore();
  const users = store.createRepository('usuarios');
  return { service: createUserService(users), users };
}

test('USR-01 registra un solicitante activo con contraseña almacenada como hash', async () => {
  const { service, users } = createService();
  const account = await service.register({
    nombre: '  Ada Lovelace  ',
    correo: ' Ada@Example.edu ',
    password: 'correcta123',
  });
  const stored = users.obtener(account.id);

  assert.equal(account.nombre, 'Ada Lovelace');
  assert.equal(account.correo, 'ada@example.edu');
  assert.equal(account.rol, 'SOLICITANTE');
  assert.equal(account.estado, 'ACTIVO');
  assert.equal('password' in stored, false);
  assert.notEqual(stored.passwordHash, 'correcta123');
  assert.equal(account.passwordHash, undefined);
});

test('USR-01 rechaza el registro con un correo duplicado exacto', async () => {
  const { service, users } = createService();
  await service.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });

  await assert.rejects(
    service.register({
      nombre: 'Grace',
      correo: 'ada@example.edu',
      password: 'otra123',
    }),
    /correo.*registrado/i,
  );
  assert.equal(users.listar().length, 1);
});

test('USR-01 rechaza correos duplicados aunque varíen mayúsculas o espacios externos', async () => {
  const { service, users } = createService();
  await service.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });

  await assert.rejects(
    service.register({
      nombre: 'Grace',
      correo: '  ADA@EXAMPLE.EDU  ',
      password: 'otra123',
    }),
    /correo.*registrado/i,
  );
  assert.equal(users.listar().length, 1);
});

test('USR-01 conserva la unicidad del correo ante registros simultáneos', async () => {
  const { service, users } = createService();
  const attempts = await Promise.allSettled([
    service.register({
      nombre: 'Ada',
      correo: 'ada@example.edu',
      password: 'correcta123',
    }),
    service.register({
      nombre: 'Grace',
      correo: ' ADA@EXAMPLE.EDU ',
      password: 'otra123',
    }),
  ]);

  assert.equal(attempts.filter((attempt) => attempt.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter((attempt) => attempt.status === 'rejected').length, 1);
  assert.equal(users.listar().length, 1);
});

test('USR-02 autentica con correo normalizado y rechaza una contraseña incorrecta', async () => {
  const { service } = createService();
  const registered = await service.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });

  const session = await service.login({
    correo: ' ADA@EXAMPLE.EDU ',
    password: 'correcta123',
  });
  assert.deepEqual(session, registered);
  await assert.rejects(
    service.login({ correo: 'ada@example.edu', password: 'incorrecta' }),
    /credenciales/i,
  );
});

test('USR-02 deniega el inicio de sesión de una cuenta inactiva', async () => {
  const { service, users } = createService();
  const registered = await service.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });
  users.guardar({ ...users.obtener(registered.id), estado: 'INACTIVO' });

  await assert.rejects(
    service.login({ correo: 'ada@example.edu', password: 'correcta123' }),
    /credenciales/i,
  );
});

test('USR-03 crea un administrador semilla con hash y sin duplicarlo al inicializar otra vez', async () => {
  const { service, users } = createService();
  const first = await service.ensureSeedAdmin();
  const stored = users.obtener(first.id);
  const second = await service.ensureSeedAdmin();

  assert.equal(users.listar().length, 1);
  assert.equal(second.id, first.id);
  assert.equal(first.correo, 'admin@uninpahu.edu');
  assert.equal(first.rol, 'ADMIN');
  assert.equal(first.estado, 'ACTIVO');
  assert.match(stored.passwordHash, /^pbkdf2-sha256\$/);
  assert.notEqual(stored.passwordHash, 'Admin123!');
  assert.equal('password' in stored, false);
  assert.deepEqual(
    await service.login({ correo: 'admin@uninpahu.edu', password: 'Admin123!' }),
    first,
  );
});

test('USR-03 no duplica el administrador semilla ante inicializaciones simultáneas', async () => {
  const { service, users } = createService();
  const [first, second] = await Promise.all([
    service.ensureSeedAdmin(),
    service.ensureSeedAdmin(),
  ]);

  assert.equal(first.id, second.id);
  assert.equal(users.listar().length, 1);
});

test('USR-04 un ADMIN activo desactiva y reactiva una cuenta sin eliminar sus datos', async () => {
  const { service, users } = createService();
  const admin = await service.ensureSeedAdmin();
  const account = await service.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });
  const before = users.obtener(account.id);

  const deactivated = service.setAccountStatus(admin, account.id, 'INACTIVO');
  assert.equal(deactivated.estado, 'INACTIVO');
  assert.deepEqual(users.obtener(account.id), { ...before, estado: 'INACTIVO' });
  await assert.rejects(
    service.login({ correo: 'ada@example.edu', password: 'correcta123' }),
    /credenciales/i,
  );

  const reactivated = service.setAccountStatus(admin, account.id, 'ACTIVO');
  assert.equal(reactivated.estado, 'ACTIVO');
  assert.deepEqual(users.obtener(account.id), before);
  assert.equal(
    (await service.login({ correo: 'ada@example.edu', password: 'correcta123' })).id,
    account.id,
  );
});

test('USR-04 un solicitante no puede activar ni desactivar cuentas', async () => {
  const { service, users } = createService();
  const admin = await service.ensureSeedAdmin();
  const account = await service.register({
    nombre: 'Ada',
    correo: 'ada@example.edu',
    password: 'correcta123',
  });
  const before = users.obtener(account.id);

  assert.throws(
    () => service.setAccountStatus(account, admin.id, 'INACTIVO'),
    /permiso/i,
  );
  assert.deepEqual(users.obtener(account.id), before);
});
