import test from 'node:test';
import assert from 'node:assert/strict';
import { intervalsOverlap } from '../../js/domain/intervals.js';

const reservation = (overrides = {}) => ({
  espacioId: 'espacio-1',
  fecha: '2027-05-12',
  inicio: 600,
  fin: 660,
  ...overrides,
});

test('SIM-01 detecta intervalos solapados y contenidos', () => {
  assert.equal(intervalsOverlap(reservation(), reservation({ inicio: 630, fin: 690 })), true);
  assert.equal(intervalsOverlap(reservation(), reservation({ inicio: 610, fin: 650 })), true);
  assert.equal(intervalsOverlap(reservation(), reservation({ inicio: 600, fin: 660 })), true);
});

test('SIM-01 no detecta intervalos disjuntos ni contiguos en ambos órdenes', () => {
  assert.equal(intervalsOverlap(reservation(), reservation({ inicio: 660, fin: 720 })), false);
  assert.equal(intervalsOverlap(reservation({ inicio: 660, fin: 720 }), reservation()), false);
  assert.equal(intervalsOverlap(reservation(), reservation({ inicio: 700, fin: 760 })), false);
});

test('SIM-01 no cruza reservas de otro espacio o fecha', () => {
  assert.equal(intervalsOverlap(reservation(), reservation({ espacioId: 'espacio-2' })), false);
  assert.equal(intervalsOverlap(reservation(), reservation({ fecha: '2027-05-13' })), false);
});
