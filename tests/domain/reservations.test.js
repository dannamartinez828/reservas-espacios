import test from 'node:test';
import assert from 'node:assert/strict';
import { intervalsOverlap } from '../../js/domain/intervals.js';
import { createMemoryStore } from '../../js/storage/repository.js';
import { createReservationService } from '../../js/domain/services/reservation-service.js';

const applicant = { id: 'sol-1', rol: 'SOLICITANTE', estado: 'ACTIVO' };
const otherApplicant = { id: 'sol-2', rol: 'SOLICITANTE', estado: 'ACTIVO' };
const admin = { id: 'admin-1', rol: 'ADMIN', estado: 'ACTIVO' };
const fixedNow = new Date(2027, 4, 12, 10, 30);
const validRequest = {
  espacioId: 'esp-1',
  fecha: '2027-05-13',
  inicio: '11:00',
  fin: '12:00',
};

function createService() {
  const store = createMemoryStore();
  const users = store.createRepository('usuarios');
  const spaces = store.createRepository('espacios');
  const reservations = store.createRepository('reservas');
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
  spaces.guardar({
    id: 'esp-2',
    tipo: 'AUDITORIO',
    nombre: 'Auditorio B',
    capacidad: 120,
    ubicacion: 'Bloque 2',
    estado: 'ACTIVO',
  });
  spaces.guardar({
    id: 'esp-inactivo',
    tipo: 'SALA_COMPUTO',
    nombre: 'Sala inactiva',
    capacidad: 20,
    ubicacion: 'Bloque 3',
    estado: 'INACTIVO',
  });
  return {
    service: createReservationService(users, spaces, reservations),
    users,
    spaces,
    reservations,
  };
}

function createReservation(overrides = {}) {
  return {
    id: 'res-existente',
    espacioId: 'esp-1',
    solicitanteId: otherApplicant.id,
    fecha: validRequest.fecha,
    inicio: 660,
    fin: 720,
    estado: 'APROBADA',
    ...overrides,
  };
}

test('SOL-01 crea una solicitud futura válida con estado PENDIENTE e identidad del solicitante', () => {
  const { service, reservations } = createService();
  const request = service.createRequest(applicant, validRequest, fixedNow);

  assert.equal(request.espacioId, validRequest.espacioId);
  assert.equal(request.solicitanteId, applicant.id);
  assert.equal(request.fecha, validRequest.fecha);
  assert.equal(request.inicio, 660);
  assert.equal(request.fin, 720);
  assert.equal(request.estado, 'PENDIENTE');
  assert.equal(reservations.obtener(request.id).estado, 'PENDIENTE');
});

test('SOL-01 acepta hoy solo cuando el inicio es posterior al momento local actual', () => {
  const { service, reservations } = createService();
  const request = service.createRequest(applicant, {
    ...validRequest,
    fecha: '2027-05-12',
    inicio: '11:00',
    fin: '12:00',
  }, fixedNow);

  assert.equal(request.estado, 'PENDIENTE');
  for (const inicio of ['10:00', '10:30']) {
    assert.throws(
      () => service.createRequest(applicant, {
        ...validRequest,
        fecha: '2027-05-12',
        inicio,
      }, fixedNow),
      /fecha|futuro|posterior/i,
    );
  }
  assert.equal(reservations.listar().length, 1);
});

test('SOL-01 rechaza fecha inválida o pasada y espacio inexistente sin crear solicitud', () => {
  const { service, reservations } = createService();
  const invalidRequests = [
    { ...validRequest, fecha: '2027-02-29' },
    { ...validRequest, fecha: '2027-05-11' },
    { ...validRequest, espacioId: 'esp-no-existe' },
  ];

  for (const request of invalidRequests) {
    assert.throws(() => service.createRequest(applicant, request, fixedNow));
  }
  assert.equal(reservations.listar().length, 0);
});

test('SOL-02 acepta los límites horarios 06:00 y 22:00', () => {
  const { service } = createService();

  assert.equal(service.createRequest(applicant, {
    ...validRequest,
    inicio: '06:00',
    fin: '06:30',
  }, fixedNow).inicio, 360);
  assert.equal(service.createRequest(otherApplicant, {
    ...validRequest,
    espacioId: 'esp-2',
    inicio: '21:30',
    fin: '22:00',
  }, fixedNow).fin, 1320);
});

test('SOL-02 rechaza horas fuera de rango, no alineadas o con inicio no anterior al fin', () => {
  const { service, reservations } = createService();
  const invalidTimes = [
    { inicio: '05:30', fin: '06:30' },
    { inicio: '21:30', fin: '22:30' },
    { inicio: '11:15', fin: '12:00' },
    { inicio: '11:00', fin: '12:15' },
    { inicio: '12:00', fin: '12:00' },
    { inicio: '12:30', fin: '12:00' },
    { inicio: 'n/a', fin: '12:00' },
  ];

  for (const time of invalidTimes) {
    assert.throws(
      () => service.createRequest(applicant, { ...validRequest, ...time }, fixedNow),
      /horario|hora/i,
    );
  }
  assert.equal(reservations.listar().length, 0);
});

test('SOL-03 rechaza solicitantes inactivos incluso si la sesión conserva estado activo', () => {
  const { service, users, reservations } = createService();
  users.guardar({ ...applicant, estado: 'INACTIVO' });

  assert.throws(
    () => service.createRequest(applicant, validRequest, fixedNow),
    /permiso/i,
  );
  assert.equal(reservations.listar().length, 0);
});

test('SOL-03 rechaza un espacio inactivo sin guardar la solicitud', () => {
  const { service, reservations } = createService();

  assert.throws(
    () => service.createRequest(applicant, {
      ...validRequest,
      espacioId: 'esp-inactivo',
    }, fixedNow),
    /inactivo|activo/i,
  );
  assert.equal(reservations.listar().length, 0);
});

test('DIS-01 consulta solo espacios activos y excluye los bloqueados por reservas aprobadas', () => {
  const { service, reservations } = createService();
  reservations.guardar(createReservation());

  const available = service.getAvailableSpaces(applicant, {
    fecha: validRequest.fecha,
    inicio: '11:30',
    fin: '12:30',
  });
  assert.deepEqual(available.map((space) => space.id), ['esp-2']);
});

test('DIS-01 ignora reservas de otras fechas y devuelve espacios activos disponibles', () => {
  const { service, reservations } = createService();
  reservations.guardar(createReservation({ fecha: '2027-05-14' }));

  const available = service.getAvailableSpaces(applicant, {
    fecha: validRequest.fecha,
    inicio: '11:30',
    fin: '12:30',
  });
  assert.deepEqual(available.map((space) => space.id), ['esp-1', 'esp-2']);
});

test('DIS-02 una solicitud pendiente cruzada no bloquea disponibilidad', () => {
  const { service, reservations } = createService();
  reservations.guardar(createReservation({ estado: 'PENDIENTE' }));

  const available = service.getAvailableSpaces(applicant, {
    fecha: validRequest.fecha,
    inicio: '11:30',
    fin: '12:30',
  });
  assert.deepEqual(available.map((space) => space.id), ['esp-1', 'esp-2']);
});

test('DIS-02 extremos contiguos de una reserva aprobada no bloquean disponibilidad', () => {
  const { service, reservations } = createService();
  reservations.guardar(createReservation({ inicio: 600, fin: 660 }));
  reservations.guardar(createReservation({
    id: 'res-siguiente',
    inicio: 720,
    fin: 780,
  }));

  const after = service.getAvailableSpaces(applicant, {
    fecha: validRequest.fecha,
    inicio: '11:00',
    fin: '12:00',
  });
  const before = service.getAvailableSpaces(applicant, {
    fecha: validRequest.fecha,
    inicio: '09:00',
    fin: '10:00',
  });
  assert.deepEqual(after.map((space) => space.id), ['esp-1', 'esp-2']);
  assert.deepEqual(before.map((space) => space.id), ['esp-1', 'esp-2']);
});

test('DIS-01 deniega consulta a una cuenta inactiva y rechaza datos inválidos', () => {
  const { service, users } = createService();
  users.guardar({ ...applicant, estado: 'INACTIVO' });

  assert.throws(
    () => service.getAvailableSpaces(applicant, {
      fecha: validRequest.fecha,
      inicio: '11:00',
      fin: '12:00',
    }),
    /permiso/i,
  );
  assert.throws(() => service.getAvailableSpaces(otherApplicant, {
    fecha: '2027-02-29',
    inicio: '11:00',
    fin: '12:00',
  }), /fecha/i);
});

test('SIM-01 reconoce cruces, contención, disyunción y contigüidad semiabierta', () => {
  const base = createReservation();
  assert.equal(intervalsOverlap(base, { ...base, inicio: 690, fin: 750 }), true);
  assert.equal(intervalsOverlap(base, { ...base, inicio: 670, fin: 710 }), true);
  assert.equal(intervalsOverlap(base, { ...base, inicio: 720, fin: 780 }), false);
  assert.equal(intervalsOverlap(base, { ...base, inicio: 600, fin: 660 }), false);
  assert.equal(intervalsOverlap(base, { ...base, inicio: 600, fin: 660 }), intervalsOverlap(
    { ...base, inicio: 600, fin: 660 },
    base,
  ));
});

test('SIM-02 rechaza una solicitud cruzada con reserva aprobada y permite pendientes cruzadas', () => {
  const { service, reservations } = createService();
  reservations.guardar(createReservation());

  assert.throws(
    () => service.createRequest(applicant, {
      ...validRequest,
      inicio: '11:30',
      fin: '12:30',
    }, fixedNow),
    /conflicto|disponible/i,
  );
  assert.equal(reservations.listar().length, 1);

  reservations.eliminar('res-existente');
  const first = service.createRequest(applicant, {
    ...validRequest,
    inicio: '11:30',
    fin: '12:30',
  }, fixedNow);
  const second = service.createRequest(otherApplicant, {
    ...validRequest,
    inicio: '11:30',
    fin: '12:30',
  }, fixedNow);
  assert.equal(first.estado, 'PENDIENTE');
  assert.equal(second.estado, 'PENDIENTE');
  assert.equal(reservations.listar().length, 2);
});

test('SIM-02 permite solicitudes contiguas a una reserva aprobada en ambos órdenes', () => {
  const { service, reservations } = createService();
  reservations.guardar(createReservation({ inicio: 600, fin: 660 }));

  const immediatelyAfter = service.createRequest(applicant, {
    ...validRequest,
    inicio: '11:00',
    fin: '12:00',
  }, fixedNow);
  const immediatelyBefore = service.createRequest(otherApplicant, {
    ...validRequest,
    inicio: '09:00',
    fin: '10:00',
  }, fixedNow);
  assert.equal(immediatelyAfter.estado, 'PENDIENTE');
  assert.equal(immediatelyBefore.estado, 'PENDIENTE');
});
