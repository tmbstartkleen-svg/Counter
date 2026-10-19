import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readConfig = (name) => JSON.parse(readFileSync(new URL('../' + name, import.meta.url), 'utf8'));
const production = readConfig('wrangler.jsonc');
const staging = readConfig('wrangler.staging.jsonc');

test('staging Worker name cannot overlap with production', () => {
  assert.notEqual(staging.name, production.name);
  assert.equal(staging.name, 'counter-beta-staging');
});

test('staging has required assets, room binding, and migrations', () => {
  assert.equal(staging.main, production.main);
  assert.equal(staging.assets.directory, './public');
  assert.equal(staging.assets.binding, 'ASSETS');
  assert.ok(staging.assets.run_worker_first.includes('/api/*'));
  assert.deepEqual(staging.durable_objects.bindings, production.durable_objects.bindings);
  assert.deepEqual(staging.migrations, production.migrations);
  assert.equal(staging.durable_objects.bindings.find((b) => b.name === 'BLACKJACK_ROOMS')?.class_name, 'BlackjackRoom');
});
