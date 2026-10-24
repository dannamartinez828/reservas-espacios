import test from 'node:test';
import assert from 'node:assert/strict';
import { canPerform } from '../../js/domain/policies/permissions.js';

const admin = { id: 'admin-1', rol: 'ADMIN', estado: 'ACTIVO' };
const applicant = { id: 'applicant-1', rol: 'SOLICITANTE', estado: 'ACTIVO' };

test('ROL-01 un ADMIN activo puede gestionar, decidir y cancelar reservas ajenas', () => {
  for (const action of [
    'manageUsers',
    'manageSpaces',
    'approveReservation',
    'rejectReservation',
    'cancelReservation',
  ]) {
    assert.equal(canPerform(admin, action, { ownerId: 'applicant-2' }), true, action);
  }
});

test('ROL-01 un SOLICITANTE no puede realizar operaciones administrativas ni cancelar reservas ajenas', () => {
  for (const action of [
    'manageUsers',
    'manageSpaces',
    'approveReservation',
    'rejectReservation',
  ]) {
    assert.equal(canPerform(applicant, action), false, action);
  }
  assert.equal(
    canPerform(applicant, 'cancelReservation', { ownerId: 'applicant-2' }),
    false,
  );
});

test('ROL-02 un SOLICITANTE activo consulta, solicita y cancela solo sus propias reservas', () => {
  assert.equal(canPerform(applicant, 'consultAvailability'), true);
  assert.equal(canPerform(applicant, 'createReservation'), true);
  assert.equal(
    canPerform(applicant, 'cancelReservation', { ownerId: applicant.id }),
    true,
  );
});

test('ROL-02 una cuenta inactiva no puede consultar, solicitar ni cancelar reservas', () => {
  const inactiveApplicant = { ...applicant, estado: 'INACTIVO' };
  assert.equal(canPerform(inactiveApplicant, 'consultAvailability'), false);
  assert.equal(canPerform(inactiveApplicant, 'createReservation'), false);
  assert.equal(
    canPerform(inactiveApplicant, 'cancelReservation', { ownerId: applicant.id }),
    false,
  );
});
