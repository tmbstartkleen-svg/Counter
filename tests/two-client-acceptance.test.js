import test from 'node:test';
import assert from 'node:assert/strict';
import { BlackjackRoom } from '../src/worker.js';

function makeRoom() {
  return new BlackjackRoom({
    storage: { get: async () => null, put: async () => {} },
    blockConcurrencyWhile: (fn) => fn(),
  }, {});
}
function client(id) {
  const messages = [];
  const socket = { send: (data) => messages.push(JSON.parse(data)) };
  return { id, name: id, token: 'token-' + id, socket, bank: 1000, wager: 25, status: 'Waiting', cards: [], messages };
}
function latestState(player) {
  return player.messages.filter((m) => m.type === 'state').at(-1);
}

test('two independently connected players receive authoritative seat and host updates', async () => {
  const room = makeRoom();
  const a = client('a'), b = client('b');
  await room.handle(a, { type: 'join' });
  await room.handle(b, { type: 'join' });
  assert.equal(latestState(a).players.length, 2);
  assert.equal(latestState(b).players.length, 2);
  assert.equal(latestState(a).hostId, 'a');
  assert.equal(latestState(b).hostId, 'a');
  assert.equal(latestState(a).players.find(p => p.id === 'b').connected, true);
  room.leave(a);
  assert.equal(latestState(b).hostId, 'b');
  assert.equal(latestState(b).players.find(p => p.id === 'a').connected, false);
});

test('cross-player commands cannot change the other player identity or start as non-host', async () => {
  const room = makeRoom();
  const a = client('a'), b = client('b');
  await room.handle(a, { type: 'join' });
  await room.handle(b, { type: 'join' });
  await assert.rejects(room.handle(b, { type: 'start' }), /Only host can deal/);
  assert.equal(room.phase, 'lobby');
  await room.handle(b, { type: 'name', name: 'Bob' });
  assert.equal(room.players.get('a').name, 'a');
  assert.equal(room.players.get('b').name, 'Bob');
  assert.equal(latestState(a).players.find(p => p.id === 'b').name, 'Bob');
});

test('active-round reconnect preserves seat without granting new player a seat', async () => {
  const room = makeRoom(), a = client('a'), b = client('b');
  await room.handle(a, { type: 'join' });
  await room.handle(b, { type: 'join' });
  room.phase = 'turn';
  room.turn = 1;
  room.players.get('b').status = 'Playing';
  const previousSocket = b.socket;
  room.leave(b);
  const replacement = client('replacement');
  await assert.rejects(room.handle(replacement, { type: 'join' }), /Wait until the current round finishes/);
  await room.handle(replacement, { type: 'resume', token: b.token });
  assert.equal(replacement.seated, 'b');
  assert.equal(room.players.size, 2);
  assert.notEqual(room.players.get('b').socket, previousSocket);
  assert.equal(room.players.get('b').socket, replacement.socket);
});
