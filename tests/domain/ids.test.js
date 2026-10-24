import test from 'node:test';
import assert from 'node:assert/strict';
import { generateId } from '../../js/domain/ids.js';

test('M1 genera identificadores con formato UUID', () => {
  assert.match(generateId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('M1 genera identificadores distintos para los registros', () => {
  const ids = Array.from({ length: 1000 }, () => generateId());
  assert.equal(new Set(ids).size, ids.length);
});
