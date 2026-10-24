import { generateId } from '../ids.js';
import { intervalsOverlap } from '../intervals.js';
import { assertCanPerform } from '../policies/permissions.js';
import {
  isStartInFuture,
  isValidCalendarDate,
  isValidReservationTime,
  timeToMinutes,
} from '../time.js';

function requireRepository(repository, methods, description) {
  if (!repository || methods.some((method) => typeof repository[method] !== 'function')) {
    throw new TypeError(`Se requiere un repositorio válido de ${description}.`);
  }
}

function requireActor(usersRepository, actor, action) {
  if (!actor || typeof actor.id !== 'string' || actor.id.length === 0) {
    throw new Error('El usuario no tiene permiso para realizar esta operación.');
  }
  const currentActor = usersRepository.obtener(actor.id);
  assertCanPerform(currentActor, action);
  return currentActor;
}

function validateDate(date) {
  if (!isValidCalendarDate(date)) {
    throw new TypeError('La fecha de reserva no es válida.');
  }
}

function validateTimes(start, end) {
  if (!isValidReservationTime(start, end)) {
    throw new TypeError('El horario de reserva no es válido.');
  }
  return {
    inicio: timeToMinutes(start),
    fin: timeToMinutes(end),
  };
}

function validateAvailabilityQuery(query) {
  if (!query || typeof query !== 'object' || Array.isArray(query)) {
    throw new TypeError('Los datos de consulta de disponibilidad no son válidos.');
  }
  validateDate(query.fecha);
  return {
    fecha: query.fecha,
    ...validateTimes(query.inicio, query.fin),
  };
}

export function createReservationService(
  usersRepository,
  spacesRepository,
  reservationsRepository,
) {
  requireRepository(usersRepository, ['obtener'], 'usuarios');
  requireRepository(spacesRepository, ['obtener', 'listar'], 'espacios');
  requireRepository(reservationsRepository, ['listar', 'guardar'], 'reservas');

  return Object.freeze({
    createRequest(actor, request, now = new Date()) {
      const currentActor = requireActor(usersRepository, actor, 'createReservation');
      if (!request || typeof request !== 'object' || Array.isArray(request)) {
        throw new TypeError('Los datos de la solicitud no son válidos.');
      }
      if (typeof request.espacioId !== 'string' || request.espacioId.length === 0) {
        throw new TypeError('El identificador del espacio no es válido.');
      }
      validateDate(request.fecha);
      const times = validateTimes(request.inicio, request.fin);
      if (!isStartInFuture(request.fecha, times.inicio, now)) {
        throw new RangeError('La fecha y hora de inicio deben ser posteriores al momento actual.');
      }

      const space = spacesRepository.obtener(request.espacioId);
      if (!space) {
        throw new Error('No se encontró el espacio solicitado.');
      }
      if (space.estado !== 'ACTIVO') {
        throw new Error('No se pueden crear solicitudes para un espacio inactivo.');
      }

      const proposed = {
        espacioId: space.id,
        fecha: request.fecha,
        ...times,
      };
      const conflict = reservationsRepository.listar().some((reservation) => (
        reservation.estado === 'APROBADA' && intervalsOverlap(proposed, reservation)
      ));
      if (conflict) {
        throw new Error('La solicitud tiene conflicto con una reserva aprobada.');
      }

      const reservation = {
        id: generateId(),
        espacioId: space.id,
        solicitanteId: currentActor.id,
        fecha: request.fecha,
        ...times,
        estado: 'PENDIENTE',
      };
      reservationsRepository.guardar(reservation);
      return reservation;
    },

    getAvailableSpaces(actor, query) {
      requireActor(usersRepository, actor, 'consultAvailability');
      const search = validateAvailabilityQuery(query);
      const blockedSpaceIds = new Set(
        reservationsRepository.listar()
          .filter((reservation) => (
            reservation.estado === 'APROBADA'
            && intervalsOverlap({
              espacioId: reservation.espacioId,
              fecha: search.fecha,
              inicio: search.inicio,
              fin: search.fin,
            }, reservation)
          ))
          .map((reservation) => reservation.espacioId),
      );

      return spacesRepository.listar().filter((space) => (
        space.estado === 'ACTIVO' && !blockedSpaceIds.has(space.id)
      ));
    },
  });
}
