import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../../js/storage/repository.js';
import { createSpaceService } from '../../js/domain/services/space-service.js';

const admin = { id: 'admin-1', rol: 'ADMIN', estado: 'ACTIVO' };
const applicant = { id: 'applicant-1', rol: 'SOLICITANTE', estado: 'ACTIVO' };

function createService() {
  const store = createMemoryStore();
  const spaces = store.createRepository('espacios');
  const reservations = store.createRepository('reservas');
  return {
    service: createSpaceService(spaces, reservations),
    spaces,
    reservations,
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

test('ESP-01 crea un espacio válido activo y conserva la forma del nombre recortada', () => {
  const { service, spaces } = createService();
  const created = service.create(admin, validSpace({ nombre: '  Laboratorio A  ' }));

  assert.equal(created.nombre, 'Laboratorio A');
  assert.equal(created.estado, 'ACTIVO');
  assert.equal(created.rol, undefined);
  assert.deepEqual(spaces.listar(), [created]);
});

test('ESP-01 permite todos los tipos especificados y rechaza cada dato inválido', () => {
  const { service, spaces } = createService();
  for (const tipo of ['LABORATORIO', 'AUDITORIO', 'SALA_COMPUTO']) {
    service.create(admin, validSpace({ tipo, nombre: tipo }));
  }

  const invalidSpaces = [
    validSpace({ tipo: 'OFICINA', nombre: 'Tipo inválido' }),
    validSpace({ nombre: '   ' }),
    validSpace({ capacidad: 0, nombre: 'Capacidad cero' }),
    validSpace({ capacidad: -1, nombre: 'Capacidad negativa' }),
    validSpace({ capacidad: 2.5, nombre: 'Capacidad decimal' }),
    validSpace({ ubicacion: '  ', nombre: 'Ubicación vacía' }),
  ];
  for (const invalidSpace of invalidSpaces) {
    assert.throws(() => service.create(admin, invalidSpace), /tipo|nombre|capacidad|ubicación/i);
  }
  assert.equal(spaces.listar().length, 3);
});

test('ESP-01 rechaza nombres duplicados tras trim y sin distinguir mayúsculas', () => {
  const { service, spaces } = createService();
  service.create(admin, validSpace());

  assert.throws(
    () => service.create(admin, validSpace({ nombre: '  LABORATORIO a  ' })),
    /nombre.*registrado/i,
  );
  assert.equal(spaces.listar().length, 1);
});

test('ESP-04 edita datos conservando identificador, estado y reservas asociadas', () => {
  const { service, spaces, reservations } = createService();
  const created = service.create(admin, validSpace());
  service.setStatus(admin, created.id, 'INACTIVO');
  const reservation = {
    id: 'reserva-1',
    espacioId: created.id,
    estado: 'PENDIENTE',
  };
  reservations.guardar(reservation);

  const edited = service.edit(admin, created.id, {
    tipo: 'AUDITORIO',
    nombre: '  Auditorio Central ',
    capacidad: 120,
    ubicacion: 'Bloque 2',
  });

  assert.deepEqual(edited, {
    id: created.id,
    tipo: 'AUDITORIO',
    nombre: 'Auditorio Central',
    capacidad: 120,
    ubicacion: 'Bloque 2',
    estado: 'INACTIVO',
  });
  assert.deepEqual(reservations.obtener(reservation.id), reservation);
});

test('ESP-04 rechaza una edición inválida o con nombre duplicado sin alterar el espacio', () => {
  const { service, spaces } = createService();
  const original = service.create(admin, validSpace());
  service.create(admin, validSpace({ nombre: 'Auditorio Central' }));
  const before = spaces.obtener(original.id);
  const invalidUpdates = [
    { tipo: 'OFICINA' },
    { nombre: '   ' },
    { nombre: ' auditorio central ' },
    { capacidad: 0 },
    { capacidad: 1.5 },
    { ubicacion: '  ' },
  ];

  for (const update of invalidUpdates) {
    assert.throws(
      () => service.edit(admin, original.id, update),
      /tipo|nombre|capacidad|ubicación/i,
    );
    assert.deepEqual(spaces.obtener(original.id), before);
  }
});

test('ESP-02 desactiva y activa espacios sin modificar reservas asociadas', () => {
  const { service, spaces, reservations } = createService();
  const space = service.create(admin, validSpace());
  const reservation = {
    id: 'reserva-1',
    espacioId: space.id,
    estado: 'APROBADA',
  };
  reservations.guardar(reservation);

  const deactivated = service.setStatus(admin, space.id, 'INACTIVO');
  assert.equal(deactivated.estado, 'INACTIVO');
  assert.deepEqual(reservations.listar(), [reservation]);

  const activated = service.setStatus(admin, space.id, 'ACTIVO');
  assert.equal(activated.estado, 'ACTIVO');
  assert.deepEqual(spaces.obtener(space.id), activated);
  assert.deepEqual(reservations.listar(), [reservation]);
});

test('ESP-02 rechaza estados de espacio distintos de ACTIVO o INACTIVO', () => {
  const { service, spaces } = createService();
  const space = service.create(admin, validSpace());

  assert.throws(() => service.setStatus(admin, space.id, 'PENDIENTE'), /estado/i);
  assert.equal(spaces.obtener(space.id).estado, 'ACTIVO');
});

test('ESP-03 un SOLICITANTE no puede crear, editar, activar ni desactivar espacios', () => {
  const { service, spaces } = createService();
  const space = service.create(admin, validSpace());
  const before = spaces.obtener(space.id);

  assert.throws(() => service.create(applicant, validSpace({ nombre: 'Otro espacio' })), /permiso/i);
  assert.throws(() => service.edit(applicant, space.id, { nombre: 'Otro nombre' }), /permiso/i);
  assert.throws(() => service.setStatus(applicant, space.id, 'INACTIVO'), /permiso/i);
  assert.deepEqual(spaces.obtener(space.id), before);
  assert.equal(spaces.listar().length, 1);
});

test('ESP-03 una cuenta ADMIN inactiva no puede gestionar espacios', () => {
  const { service, spaces } = createService();
  const inactiveAdmin = { ...admin, estado: 'INACTIVO' };

  assert.throws(() => service.create(inactiveAdmin, validSpace()), /permiso/i);
  assert.equal(spaces.listar().length, 0);
});
