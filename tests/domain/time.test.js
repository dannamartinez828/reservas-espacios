import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isStartInFuture,
  isValidCalendarDate,
  isValidReservationTime,
  timeToMinutes,
} from '../../js/domain/time.js';

function localDate(year, month, day, hour = 0, minute = 0, second = 0) {
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, second, 0);
  return date;
}

test('SOL-01 reconoce fechas de calendario válidas e inválidas', () => {
  assert.equal(isValidCalendarDate('2028-02-29'), true);
  assert.equal(isValidCalendarDate('2027-02-29'), false);
  assert.equal(isValidCalendarDate('2027-13-01'), false);
  assert.equal(isValidCalendarDate('2027-2-01'), false);
});

test('SOL-01 rechaza fechas pasadas y acepta inicio de hoy solo si aún es futuro', () => {
  const now = localDate(2027, 5, 12, 10, 30);

  assert.equal(isStartInFuture('2027-05-11', 23 * 60, now), false);
  assert.equal(isStartInFuture('2027-05-12', 10 * 60 + 29, now), false);
  assert.equal(isStartInFuture('2027-05-12', 10 * 60 + 30, now), false);
  assert.equal(isStartInFuture('2027-05-12', 10 * 60 + 31, now), true);
  assert.equal(isStartInFuture('2027-05-13', 6 * 60, now), true);
});

test('SOL-02 convierte horas válidas a minutos y rechaza formatos incorrectos', () => {
  assert.equal(timeToMinutes('06:00'), 360);
  assert.equal(timeToMinutes('22:00'), 1320);
  assert.throws(() => timeToMinutes('6:00'), RangeError);
  assert.throws(() => timeToMinutes('24:00'), RangeError);
});

test('SOL-02 acepta inicio 06:00 y fin 22:00 como límites del horario', () => {
  assert.equal(isValidReservationTime('06:00', '22:00'), true);
  assert.equal(isValidReservationTime('06:00', '06:30'), true);
  assert.equal(isValidReservationTime('21:30', '22:00'), true);
});

test('SOL-02 rechaza horarios fuera de límites, no alineados o sin duración positiva', () => {
  assert.equal(isValidReservationTime('05:30', '06:30'), false);
  assert.equal(isValidReservationTime('21:30', '22:30'), false);
  assert.equal(isValidReservationTime('06:15', '07:00'), false);
  assert.equal(isValidReservationTime('07:00', '06:30'), false);
  assert.equal(isValidReservationTime('07:00', '07:00'), false);
});
