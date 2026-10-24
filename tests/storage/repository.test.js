import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHistoryRepository,
  createLocalStorageStore,
  createMemoryStore,
} from '../../js/storage/repository.js';

function assertRepositoryCrud(createStore) {
  const store = createStore();
  const users = store.createRepository('usuarios');

  users.guardar({ id: 'u-1', nombre: 'Ada' });
  assert.deepEqual(users.obtener('u-1'), { id: 'u-1', nombre: 'Ada' });
  assert.deepEqual(users.listar(), [{ id: 'u-1', nombre: 'Ada' }]);

  const fetched = users.obtener('u-1');
  fetched.nombre = 'Mutada';
  assert.equal(users.obtener('u-1').nombre, 'Ada');

  users.guardar({ id: 'u-1', nombre: 'Grace' });
  assert.equal(users.obtener('u-1').nombre, 'Grace');
  assert.equal(users.eliminar('u-1'), true);
  assert.equal(users.obtener('u-1'), null);
  assert.equal(users.eliminar('u-1'), false);
}

test('M1 el repositorio en memoria implementa CRUD y aísla sus datos', () => {
  assertRepositoryCrud(() => createMemoryStore());
});

test('M1 el repositorio localStorage implementa CRUD y persiste mediante un objeto falso', () => {
  const values = new Map();
  const storage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };

  assertRepositoryCrud(() => createLocalStorageStore(storage, 'reservas-test'));
  assert.equal(values.has('reservas-test'), true);
});

test('M1 todos los repositorios localStorage comparten un documento JSON', () => {
  const values = new Map();
  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
  const store = createLocalStorageStore(storage, 'reservas-test');
  store.createRepository('reservas').guardar({ id: 'r-1', estado: 'PENDIENTE' });
  store.createRepository('usuarios').guardar({ id: 'u-1', nombre: 'Ada' });

  assert.equal(values.size, 1);
  const document = JSON.parse(values.get('reservas-test'));
  assert.equal(document.collections.reservas.find((record) => record.id === 'r-1').estado, 'PENDIENTE');
  assert.equal(document.collections.usuarios.find((record) => record.id === 'u-1').nombre, 'Ada');
});

test('HIS-01 el almacén guarda registros de varias colecciones con una sola escritura', () => {
  const values = new Map();
  let writes = 0;
  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      writes += 1;
      values.set(key, value);
    },
  };
  const store = createLocalStorageStore(storage, 'transacciones-test');

  store.guardarLote([
    { coleccion: 'reservas', registro: { id: 'r-1', estado: 'PENDIENTE' } },
    {
      coleccion: 'historial',
      registro: {
        id: 'h-1',
        reservaId: 'r-1',
        estadoAnterior: null,
        estadoNuevo: 'PENDIENTE',
        fechaHora: '2027-05-11T12:00:00.000Z',
        actorId: 'u-1',
        motivo: '',
      },
    },
  ]);

  assert.equal(writes, 1);
  assert.equal(store.createRepository('reservas').obtener('r-1').estado, 'PENDIENTE');
  assert.equal(store.createRepository('historial').obtener('h-1').reservaId, 'r-1');
});

test('HIS-02 una escritura fallida en un lote no persiste registros parcialmente', () => {
  const values = new Map();
  let failWrites = false;
  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (failWrites) {
        throw new Error('escritura fallida');
      }
      values.set(key, value);
    },
  };
  const store = createLocalStorageStore(storage, 'transacciones-test');
  const reservations = store.createRepository('reservas');
  const history = store.createRepository('historial');
  reservations.guardar({ id: 'r-1', estado: 'PENDIENTE' });
  const persistedBefore = values.get('transacciones-test');

  failWrites = true;
  assert.throws(() => store.guardarLote([
    { coleccion: 'reservas', registro: { id: 'r-1', estado: 'APROBADA' } },
    {
      coleccion: 'historial',
      registro: {
        id: 'h-1',
        reservaId: 'r-1',
        estadoAnterior: null,
        estadoNuevo: 'PENDIENTE',
        fechaHora: '2027-05-11T12:00:00.000Z',
        actorId: 'u-1',
        motivo: '',
      },
    },
  ]), /escritura fallida/);

  assert.equal(values.get('transacciones-test'), persistedBefore);
  assert.equal(reservations.obtener('r-1').estado, 'PENDIENTE');
  assert.equal(history.listar('r-1').length, 0);
});

test('HIS-02 el repositorio de historial impide editar o eliminar registros existentes', () => {
  const store = createMemoryStore();
  const repository = store.createRepository('historial');
  const event = {
    id: 'h-1',
    reservaId: 'r-1',
    estadoAnterior: null,
    estadoNuevo: 'PENDIENTE',
    fechaHora: '2027-05-11T12:00:00.000Z',
    actorId: 'u-1',
    motivo: '',
  };
  repository.guardar(event);

  assert.throws(
    () => repository.guardar({ ...event, estadoNuevo: 'CANCELADA' }),
    /historial|inmutable/i,
  );
  assert.throws(() => repository.eliminar(event.id), /historial|inmutable/i);
  assert.deepEqual(repository.obtener(event.id), event);
});

test('HIS-02 un lote no permite editar un evento de historial existente', () => {
  const store = createMemoryStore();
  const history = createHistoryRepository(store);
  const event = {
    id: 'h-1',
    reservaId: 'r-1',
    estadoAnterior: null,
    estadoNuevo: 'PENDIENTE',
    fechaHora: '2027-05-11T12:00:00.000Z',
    actorId: 'u-1',
    motivo: '',
  };
  history.agregar(event);

  assert.throws(() => store.guardarLote([
    { coleccion: 'historial', registro: { ...event, estadoNuevo: 'CANCELADA' } },
  ]), /historial|existente|inmutable/i);
  assert.deepEqual(history.listar('r-1'), [event]);
});

test('M1 el historial solo permite agregar y consultar eventos', () => {
  const history = createHistoryRepository(createMemoryStore());
  const event = {
    id: 'h-1',
    reservaId: 'r-1',
    estadoAnterior: null,
    estadoNuevo: 'PENDIENTE',
    fechaHora: '2027-05-11T12:00:00.000Z',
    actorId: 'u-1',
    motivo: '',
  };

  history.agregar(event);
  event.estadoNuevo = 'CANCELADA';

  assert.deepEqual(history.listar('r-1'), [{
    id: 'h-1',
    reservaId: 'r-1',
    estadoAnterior: null,
    estadoNuevo: 'PENDIENTE',
    fechaHora: '2027-05-11T12:00:00.000Z',
    actorId: 'u-1',
    motivo: '',
  }]);
  assert.equal('eliminar' in history, false);
  assert.equal('guardar' in history, false);
  assert.throws(() => history.agregar({ ...event, id: 'h-1' }), /identificador/);
});

test('M1 el repositorio expone errores de lectura y escritura del almacenamiento', () => {
  const storage = {
    getItem() {
      throw new Error('lectura fallida');
    },
    setItem() {
      throw new Error('escritura fallida');
    },
  };

  assert.throws(
    () => createLocalStorageStore(storage).createRepository('reservas').listar(),
    /lectura fallida/,
  );

  const writeOnlyStorage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error('escritura fallida');
    },
  };
  assert.throws(
    () => createLocalStorageStore(writeOnlyStorage).createRepository('reservas')
      .guardar({ id: 'r-1' }),
    /escritura fallida/,
  );
});
