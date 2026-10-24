const ADMIN_ACTIONS = new Set([
  'manageUsers',
  'manageSpaces',
  'approveReservation',
  'rejectReservation',
]);

export function canPerform(actor, action, { ownerId } = {}) {
  if (!actor || typeof actor.id !== 'string' || actor.id.length === 0
    || actor.estado !== 'ACTIVO') {
    return false;
  }

  if (ADMIN_ACTIONS.has(action)) {
    return actor.rol === 'ADMIN';
  }
  if (action === 'cancelReservation') {
    return actor.rol === 'ADMIN'
      || (actor.rol === 'SOLICITANTE' && ownerId === actor.id);
  }
  if (action === 'consultAvailability' || action === 'createReservation') {
    return actor.rol === 'SOLICITANTE';
  }
  return false;
}

export function assertCanPerform(actor, action, options) {
  if (!canPerform(actor, action, options)) {
    throw new Error('El usuario no tiene permiso para realizar esta operación.');
  }
}
