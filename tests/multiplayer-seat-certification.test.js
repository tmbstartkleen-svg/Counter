import test from 'node:test';
import assert from 'node:assert/strict';
import { BlackjackRoom } from '../src/worker.js';

function room() {
  const state = {
    storage: { get: async () => null, put: async () => {} },
    blockConcurrencyWhile: (fn) => fn(),
  };
  return new BlackjackRoom(state, {});
}
function connection(id) {
  const sent = [];
  const socket = { send(value) { sent.push(JSON.parse(value)); }, close() { this.closed = true; } };
  return { id, token: 'token-' + id, name: id, socket, bank: 1000, wager: 25, cards: [], status: 'Waiting', sent };
}

test('four connected human seats fit; fifth join is rejected', async () => {
  const r = room();
  for (let i = 1; i <= 4; i++) await r.handle(connection('p' + i), { type: 'join' });
  assert.equal(r.players.size, 4);
  assert.equal(r.host, 'p1');
  await assert.rejects(r.handle(connection('p5'), { type: 'join' }), /Room full/);
  assert.equal(r.players.size, 4);
});

test('reconnecting to reserved seat preserves chips without allocating a fifth seat', async () => {
  const r = room(), first = connection('first');
  await r.handle(first, { type: 'join' });
  const seat = r.players.get('first');
  seat.bank = 725;
  r.leave(first);
  assert.equal(seat.socket, null);
  const returning = connection('returning');
  await r.handle(returning, { type: 'resume', token: seat.token });
  assert.equal(returning.seated, 'first');
  assert.equal(r.players.size, 1);
  assert.equal(seat.bank, 725);
  assert.equal(seat.socket, returning.socket);
  assert.equal(returning.sent.find(m => m.type === 'welcome')?.reconnected, true);
  await assert.rejects(r.handle(connection('stranger'), { type: 'resume', token: 'wrong' }), /invalid or expired/);
});

test('host handoff after disconnect prevents stale socket from acting', async () => {
  const r = room(), alice = connection('alice'), bob = connection('bob');
  await r.handle(alice, { type: 'join' });
  await r.handle(bob, { type: 'join' });
  r.leave(alice);
  assert.equal(r.host, 'bob');
  const returning = connection('returning');
  await r.handle(returning, { type: 'resume', token: alice.token });
  assert.equal(r.host, 'bob');
  await assert.rejects(r.handle(alice, { type: 'name', name: 'Stale' }), /no longer active/);
  await r.handle(returning, { type: 'leaveRoom' });
  assert.equal(r.players.has('alice'), false);
  assert.equal(r.host, 'bob');
  await assert.rejects(r.handle(connection('later'), { type: 'resume', token: alice.token }), /invalid or expired/);
});
