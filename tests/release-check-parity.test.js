import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const workflow = readFileSync(new URL('../.github/workflows/verify.yml', import.meta.url), 'utf8');

function checkedFiles(source) {
  return [...source.matchAll(/\bnode\s+--check\s+([^\s&|]+)/g)].map((match) => match[1]).sort();
}

test('local npm check and release workflow syntax-check identical files', () => {
  const localFiles = checkedFiles(pkg.scripts.check);
  const ciFiles = checkedFiles(workflow);
  assert.ok(localFiles.length > 0, 'Local check must include JS syntax validation');
  assert.equal(new Set(localFiles).size, localFiles.length, 'No duplicate local syntax-check entries');
  assert.equal(new Set(ciFiles).size, ciFiles.length, 'No duplicate CI syntax-check entries');
  assert.deepEqual(localFiles, ciFiles, 'Keep npm run check and release workflow syntax-check lists in sync');
});

test('local check continues to execute regression tests', () => {
  assert.match(pkg.scripts.check, /\bnpm\s+test\b/, 'npm run check must include regression suite');
  assert.match(pkg.scripts.test, /\bnode\s+--test\b/, 'npm test must run the Node test suite');
});
