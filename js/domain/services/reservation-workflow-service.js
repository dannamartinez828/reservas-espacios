import { generateId } from '../ids.js';
import { intervalsOverlap } from '../intervals.js';
import { assertCanPerform } from '../policies/permissions.js';
import { isValidCalendarDate } from '../time.js';

const ALLOWED_TRANSITIONS = Object.freeze({
  PENDIENTE: new Set(['APROBADA', 'RECHAZADA', 'CANCELADA']),
  APROBADA: new Set(['CANCELADA']),
});

function requireRepository(repository, methods, description) {
  if (!repository || methods.some((method) => typeof repository[method] !== 'function')) {
    throw new TypeError(`Se requiere un repositorio válido de ${description}.`);
  }
}

function validateNow(now) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError('La fecha-hora actual no es válida.');
  }
}

function getCurrentActor(usersRepository, actor, action, reservation) {
  if (!actor || typeof actor.id !== 'string' || actor.id.length === 0) {
    throw new Error('El usuario no tiene permiso para realizar esta operación.');
  }
  const currentActor = usersRepository.obtener(actor.id);
  assertCanPerform(currentActor, action, {
    ownerId: reservation?.solicitanteId,
  });
  return currentActor;
}

function getReservation(reservationsRepository, reservationId) {
  if (typeof reservationId !== 'string' || reservationId.length === 0) {
    throw new TypeError('El identificador de la reserva no es válido.');
  }
  const reservation = reservationsRepository.obtener(reservationId);
  if (!reservation) {
    throw new Error('No se encontró la reserva.');
  }
  return reservation;
}

function assertTransition(reservation, nextState) {
  if (!ALLOWED_TRANSITIONS[reservation.estado]?.has(nextState)) {
    throw new Error(`La transición de ${reservation.estado} a ${nextState} no está permitida.`);
  }
}

function createHistoryEvent(reservation, estadoNuevo, actor, motivo, now) {
  return {
    id: generateId(),
    reservaId: reservation.id,
    estadoAnterior: reservation.estado,
    estadoNuevo,
    fechaHora: now.toISOString(),
    actorId: actor.id,
    motivo,
  };
}

function saveTransition(reservationsRepository, reservation, estadoNuevo, actor, motivo, now) {
  const updatedReservation = { ...reservation, estado: estadoNuevo };
  if (estadoNuevo === 'RECHAZADA') {
    updatedReservation.motivo = motivo;
  }
  const event = createHistoryEvent(reservation, estadoNuevo, actor, motivo, now);

  reservationsRepository.guardarLote([
    { coleccion: 'reservas', registro: updatedReservation },
    { coleccion: 'historial', registro: event },
  ]);
  return updatedReservation;
}

function getReservationEnd(reservation) {
  if (!isValidCalendarDate(reservation.fecha)
    || !Number.isInteger(reservation.fin) || reservation.fin < 0 || reservation.fin >= 24 * 60) {
    throw new TypeError('La fecha u hora de fin de la reserva no es válida.');
  }

  const [year, month, day] = reservation.fecha.split('-').map(Number);
  const end = new Date(0);
  end.setFullYear(year, month - 1, day);
  end.setHours(Math.floor(reservation.fin / 60), reservation.fin % 60, 0, 0);
  return end;
}

export function createReservationWorkflowService(usersRepository, reservationsRepository) {
  requireRepository(usersRepository, ['obtener'], 'usuarios');
  requireRepository(
    reservationsRepository,
    ['obtener', 'listar', 'guardarLote'],
    'reservas',
  );

  return Object.freeze({
    approve(actor, reservationId, now = new Date()) {
      validateNow(now);
      const currentActor = getCurrentActor(usersRepository, actor, 'approveReservation');
      const reservation = getReservation(reservationsRepository, reservationId);
      assertTransition(reservation, 'APROBADA');

      const conflict = reservationsRepository.listar().some((existing) => (
        existing.id !== reservation.id
        && existing.estado === 'APROBADA'
        && intervalsOverlap(existing, reservation)
      ));
      if (conflict) {
        throw new Error('La solicitud tiene conflicto con otra reserva aprobada.');
      }

      return saveTransition(
        reservationsRepository,
        reservation,
        'APROBADA',
        currentActor,
        '',
        now,
      );
    },

    reject(actor, reservationId, motivo, now = new Date()) {
      validateNow(now);
      const currentActor = getCurrentActor(usersRepository, actor, 'rejectReservation');
      const reservation = getReservation(reservationsRepository, reservationId);
      assertTransition(reservation, 'RECHAZADA');
      if (typeof motivo !== 'string' || motivo.trim().length === 0) {
        throw new TypeError('El motivo de rechazo es obligatorio.');
      }

      return saveTransition(
        reservationsRepository,
        reservation,
        'RECHAZADA',
        currentActor,
        motivo.trim(),
        now,
      );
    },

    cancel(actor, reservationId, now = new Date()) {
      validateNow(now);
      const reservation = getReservation(reservationsRepository, reservationId);
      const currentActor = getCurrentActor(
        usersRepository,
        actor,
        'cancelReservation',
        reservation,
      );
      assertTransition(reservation, 'CANCELADA');
      if (now.getTime() >= getReservationEnd(reservation).getTime()) {
        throw new Error('La reserva ya alcanzó su hora de fin y no se puede cancelar.');
      }

      return saveTransition(
        reservationsRepository,
        reservation,
        'CANCELADA',
        currentActor,
        '',
        now,
      );
    },
  });
}
