import { generateId } from '../ids.js';
import { assertCanPerform } from '../policies/permissions.js';

const SPACE_TYPES = new Set(['LABORATORIO', 'AUDITORIO', 'SALA_COMPUTO']);
const SPACE_STATUSES = new Set(['ACTIVO', 'INACTIVO']);

function validateSpaceData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new TypeError('Los datos del espacio no son válidos.');
  }

  if (!SPACE_TYPES.has(data.tipo)) {
    throw new TypeError('El tipo de espacio no es válido.');
  }
  if (typeof data.nombre !== 'string' || data.nombre.trim().length === 0) {
    throw new TypeError('El nombre del espacio es obligatorio.');
  }
  if (!Number.isInteger(data.capacidad) || data.capacidad <= 0) {
    throw new TypeError('La capacidad debe ser un entero mayor que cero.');
  }
  if (typeof data.ubicacion !== 'string' || data.ubicacion.trim().length === 0) {
    throw new TypeError('La ubicación del espacio es obligatoria.');
  }

  return {
    tipo: data.tipo,
    nombre: data.nombre.trim(),
    capacidad: data.capacidad,
    ubicacion: data.ubicacion.trim(),
  };
}

function assertUniqueName(spacesRepository, nombre, excludedId) {
  const normalizedName = nombre.toLowerCase();
  const duplicate = spacesRepository.listar().some((space) => (
    space.id !== excludedId && space.nombre.trim().toLowerCase() === normalizedName
  ));
  if (duplicate) {
    throw new Error('El nombre del espacio ya está registrado.');
  }
}

function validateSpaceId(spaceId) {
  if (typeof spaceId !== 'string' || spaceId.length === 0) {
    throw new TypeError('El identificador del espacio no es válido.');
  }
}

export function createSpaceService(spacesRepository) {
  if (!spacesRepository || typeof spacesRepository.listar !== 'function'
    || typeof spacesRepository.obtener !== 'function'
    || typeof spacesRepository.guardar !== 'function') {
    throw new TypeError('Se requiere un repositorio de espacios.');
  }

  return Object.freeze({
    list(actor) {
      assertCanPerform(actor, 'manageSpaces');
      return spacesRepository.listar();
    },

    create(actor, data) {
      assertCanPerform(actor, 'manageSpaces');
      const spaceData = validateSpaceData(data);
      assertUniqueName(spacesRepository, spaceData.nombre);

      const space = {
        id: generateId(),
        ...spaceData,
        estado: 'ACTIVO',
      };
      spacesRepository.guardar(space);
      return space;
    },

    edit(actor, spaceId, changes) {
      assertCanPerform(actor, 'manageSpaces');
      validateSpaceId(spaceId);
      const existing = spacesRepository.obtener(spaceId);
      if (!existing) {
        throw new Error('No se encontró el espacio.');
      }

      const spaceData = validateSpaceData({ ...existing, ...changes });
      assertUniqueName(spacesRepository, spaceData.nombre, spaceId);
      const updatedSpace = {
        ...existing,
        ...spaceData,
        id: existing.id,
        estado: existing.estado,
      };
      spacesRepository.guardar(updatedSpace);
      return updatedSpace;
    },

    setStatus(actor, spaceId, estado) {
      assertCanPerform(actor, 'manageSpaces');
      validateSpaceId(spaceId);
      if (!SPACE_STATUSES.has(estado)) {
        throw new TypeError('El estado del espacio no es válido.');
      }

      const existing = spacesRepository.obtener(spaceId);
      if (!existing) {
        throw new Error('No se encontró el espacio.');
      }
      const updatedSpace = { ...existing, estado };
      spacesRepository.guardar(updatedSpace);
      return updatedSpace;
    },
  });
}
