import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createHistoryRepository,
  createLocalStorageStore,
  createMemoryStore,
} from '../../js/storage/repository.js';
import { createReservationService } from '../../js/domain/services/reservation-service.js';
import { createReservationWorkflowService } from '../../js/domain/services/reservation-workflow-service.js';

const applicant = { id: 'sol-1', rol: 'SOLICITANTE', estado: 'ACTIVO' };
const otherApplicant = { id: 'sol-2', rol: 'SOLICITANTE', estado: 'ACTIVO' };
const admin = { id: 'admin-1', rol: 'ADMIN', estado: 'ACTIVO' };
const beforeReservation = new Date(2027, 4, 12, 10, 30);
const beforeReservationEnd = new Date(2027, 4, 13, 11, 30);
const atReservationEnd = new Date(2027, 4, 13, 12, 0);
const afterReservationEnd = new Date(2027, 4, 13, 12, 1);
const requestData = {
  espacioId: 'esp-1',
  fecha: '2027-05-13',
  inicio: '11:00',
  fin: '12:00',
};

function createFixture(store = createMemoryStore()) {
  const users = store.createRepository('usuarios');
  const spaces = store.createRepository('espacios');
  const reservations = store.createRepository('reservas');
  const history = createHistoryRepository(store);
  users.guardar(applicant);
  users.guardar(otherApplicant);
  users.guardar(admin);
  spaces.guardar({
    id: 'esp-1',
    tipo: 'LABORATORIO',
    nombre: 'Laboratorio A',
    capacidad: 30,
    ubicacion: 'Bloque 1',
    estado: 'ACTIVO',
  });

  return {
    store,
    users,
    spaces,
    reservations,
    history,
    requests: createReservationService(users, spaces, reservations),
    workflow: createReservationWorkflowService(users, reservations),
  };
}

function createRequest(fixture, actor = applicant) {
  return fixture.requests.createRequest(actor, requestData, beforeReservation);
}

function createFailingStorageFixture() {
  const values = new Map();
  let failWrites = false;
  const storage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (failWrites) {
        throw new Error('persistencia fallida');
      }
      values.set(key, value);
    },
  };
  const store = createLocalStorageStore(storage, 'reservas-atomic-test');
  const fixture = createFixture(store);
  return {
    ...fixture,
    getPersistedDocument() {
      return values.get('reservas-atomic-test');
    },
    failWrites() {
      failWrites = true;
    },
  };
}

test('APR-01 un ADMIN activo aprueba una solicitud pendiente aunque el espacio esté inactivo', () => {
  const fixture = createFixture();
  const request = createRequest(fixture);
  fixture.spaces.guardar({ ...fixture.spaces.obtener('esp-1'), estado: 'INACTIVO' });

  const approved = fixture.workflow.approve(admin, request.id, beforeReservation);

  assert.equal(approved.estado, 'APROBADA');
  assert.equal(fixture.reservations.obtener(request.id).estado, 'APROBADA');
});

test('APR-01 solo un ADMIN activo puede aprobar una solicitud pendiente', () => {
  const fixture = createFixture();
  const request = createRequest(fixture);

  assert.throws(() => fixture.workflow.approve(applicant, request.id), /permiso/i);
  fixture.users.guardar({ ...admin, estado: 'INACTIVO' });
  assert.throws(() => fixture.workflow.approve(admin, request.id), /permiso/i);
  assert.equal(fixture.reservations.obtener(request.id).estado, 'PENDIENTE');
});

test('SIM-03 revalida cruces aprobados y conserva pendiente la solicitud en conflicto', () => {
  const fixture = createFixture();
  const first = createRequest(fixture);
  const second = fixture.requests.createRequest(otherApplicant, {
    ...requestData,
    inicio: '11:30',
    fin: '12:30',
  }, beforeReservation);

  fixture.workflow.approve(admin, first.id, beforeReservation);
  assert.throws(
    () => fixture.workflow.approve(admin, second.id, beforeReservation),
    /conflicto|cruce/i,
  );
  assert.equal(fixture.reservations.obtener(second.id).estado, 'PENDIENTE');
});

test('APR-02 rechaza solo con motivo no vacío tras trim y conserva el motivo limpio', () => {
  const fixture = createFixture();
  const request = createRequest(fixture);

  assert.throws(
    () => fixture.workflow.reject(applicant, request.id, 'Motivo válido'),
    /permiso/i,
  );
  assert.throws(() => fixture.workflow.reject(admin, request.id, ''), /motivo/i);
  assert.throws(() => fixture.workflow.reject(admin, request.id, '   '), /motivo/i);
  assert.equal(fixture.reservations.obtener(request.id).estado, 'PENDIENTE');

  const rejected = fixture.workflow.reject(admin, request.id, '  Fuera de alcance  ', beforeReservation);
  assert.equal(rejected.estado, 'RECHAZADA');
  assert.equal(rejected.motivo, 'Fuera de alcance');
});

test('APR-03 rechaza transiciones inválidas y mantiene finales RECHAZADA y CANCELADA', () => {
  const fixture = createFixture();
  const rejected = createRequest(fixture);
  fixture.workflow.reject(admin, rejected.id, 'No disponible', beforeReservation);
  assert.throws(
    () => fixture.workflow.approve(admin, rejected.id, beforeReservation),
    /transición|estado/i,
  );
  assert.equal(fixture.reservations.obtener(rejected.id).estado, 'RECHAZADA');

  const approved = createRequest(fixture, otherApplicant);
  fixture.workflow.approve(admin, approved.id, beforeReservation);
  assert.throws(
    () => fixture.workflow.reject(admin, approved.id, 'Motivo', beforeReservation),
    /transición|estado/i,
  );
  assert.equal(fixture.reservations.obtener(approved.id).estado, 'APROBADA');

  fixture.workflow.cancel(admin, approved.id, beforeReservationEnd);
  assert.throws(
    () => fixture.workflow.cancel(admin, approved.id, beforeReservationEnd),
    /transición|estado/i,
  );
  assert.equal(fixture.reservations.obtener(approved.id).estado, 'CANCELADA');
});

test('CAN-01 permite cancelar reservas propias al solicitante y ajenas al ADMIN', () => {
  const fixture = createFixture();
  const ownRequest = createRequest(fixture);
  const otherRequest = createRequest(fixture, otherApplicant);

  assert.equal(
    fixture.workflow.cancel(applicant, ownRequest.id, beforeReservationEnd).estado,
    'CANCELADA',
  );
  assert.equal(
    fixture.workflow.cancel(admin, otherRequest.id, beforeReservationEnd).estado,
    'CANCELADA',
  );
});

test('CAN-01 deniega la cancelación a un solicitante que fue desactivado después de iniciar sesión', () => {
  const fixture = createFixture();
  const request = createRequest(fixture);
  fixture.users.guardar({ ...applicant, estado: 'INACTIVO' });

  assert.throws(
    () => fixture.workflow.cancel(applicant, request.id, beforeReservationEnd),
    /permiso/i,
  );
  assert.equal(fixture.reservations.obtener(request.id).estado, 'PENDIENTE');
});

test('CAN-01 deniega cancelación ajena al solicitante e intentos en la hora de fin o después', () => {
  const fixture = createFixture();
  const ownedByOther = createRequest(fixture, otherApplicant);

  assert.throws(
    () => fixture.workflow.cancel(applicant, ownedByOther.id, beforeReservationEnd),
    /permiso/i,
  );
  assert.equal(fixture.reservations.obtener(ownedByOther.id).estado, 'PENDIENTE');

  for (const now of [atReservationEnd, afterReservationEnd]) {
    assert.throws(
      () => fixture.workflow.cancel(admin, ownedByOther.id, now),
      /fin|terminado|vigencia/i,
    );
    assert.equal(fixture.reservations.obtener(ownedByOther.id).estado, 'PENDIENTE');
  }
});

test('HIS-01 creación, aprobación y cancelación registran eventos coherentes', () => {
  const fixture = createFixture();
  const request = createRequest(fixture);
  fixture.workflow.approve(admin, request.id, beforeReservation);
  fixture.workflow.cancel(admin, request.id, beforeReservationEnd);

  const events = fixture.history.listar(request.id);
  assert.equal(events.length, 3);
  assert.deepEqual(
    events.map(({ estadoAnterior, estadoNuevo, actorId, motivo }) => ({
      estadoAnterior,
      estadoNuevo,
      actorId,
      motivo,
    })),
    [
      {
        estadoAnterior: null,
        estadoNuevo: 'PENDIENTE',
        actorId: applicant.id,
        motivo: '',
      },
      {
        estadoAnterior: 'PENDIENTE',
        estadoNuevo: 'APROBADA',
        actorId: admin.id,
        motivo: '',
      },
      {
        estadoAnterior: 'APROBADA',
        estadoNuevo: 'CANCELADA',
        actorId: admin.id,
        motivo: '',
      },
    ],
  );
  for (const event of events) {
    assert.equal(typeof event.id, 'string');
    assert.equal(event.reservaId, request.id);
    assert.equal(Number.isNaN(Date.parse(event.fechaHora)), false);
    assert.equal('motivo' in event, true);
  }
});

test('HIS-02 el historial solo expone agregar y consultar y no permite editar eventos', () => {
  const fixture = createFixture();
  const request = createRequest(fixture);
  const [initialEvent] = fixture.history.listar(request.id);

  assert.equal('guardar' in fixture.history, false);
  assert.equal('eliminar' in fixture.history, false);
  assert.throws(() => fixture.store.guardarLote([
    {
      coleccion: 'historial',
      registro: { ...initialEvent, estadoNuevo: 'CANCELADA' },
    },
  ]), /historial|existente|inmutable/i);
  assert.equal(fixture.history.listar(request.id)[0].estadoNuevo, 'PENDIENTE');
});

test('HIS-01 HIS-02 una falla de persistencia conserva reserva e historial sin cambios', () => {
  const creationFixture = createFailingStorageFixture();
  const beforeCreate = creationFixture.getPersistedDocument();
  creationFixture.failWrites();
  assert.throws(
    () => createRequest(creationFixture),
    /persistencia fallida/i,
  );
  assert.equal(creationFixture.getPersistedDocument(), beforeCreate);
  assert.equal(creationFixture.reservations.listar().length, 0);
  assert.equal(creationFixture.history.listar('sin-reserva').length, 0);

  for (const transition of ['approve', 'reject', 'cancel']) {
    const fixture = createFailingStorageFixture();
    const request = createRequest(fixture);
    const beforeTransition = fixture.getPersistedDocument();
    fixture.failWrites();

    assert.throws(() => {
      if (transition === 'approve') {
        fixture.workflow.approve(admin, request.id, beforeReservation);
      } else if (transition === 'reject') {
        fixture.workflow.reject(admin, request.id, 'Motivo', beforeReservation);
      } else {
        fixture.workflow.cancel(admin, request.id, beforeReservationEnd);
      }
    }, /persistencia fallida/i);

    assert.equal(fixture.getPersistedDocument(), beforeTransition);
    assert.equal(fixture.reservations.obtener(request.id).estado, 'PENDIENTE');
    assert.equal(fixture.history.listar(request.id).length, 1);
    assert.equal(fixture.history.listar(request.id)[0].estadoNuevo, 'PENDIENTE');
  }
});

test('HIS-01 dos solicitudes pendientes cruzadas solo permiten aprobar la primera', () => {
  const fixture = createFixture();
  const first = createRequest(fixture);
  const second = fixture.requests.createRequest(otherApplicant, {
    ...requestData,
    inicio: '11:30',
    fin: '12:30',
  }, beforeReservation);

  assert.equal(fixture.workflow.approve(admin, first.id, beforeReservation).estado, 'APROBADA');
  assert.throws(
    () => fixture.workflow.approve(admin, second.id, beforeReservation),
    /conflicto|cruce/i,
  );
  assert.deepEqual(
    fixture.history.listar(second.id).map((event) => event.estadoNuevo),
    ['PENDIENTE'],
  );
});
