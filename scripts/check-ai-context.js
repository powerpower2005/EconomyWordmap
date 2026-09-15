import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadRecords, queryRecords } from './ai-context.js';

const records = loadRecords();
const query = (...args) => queryRecords(records, args);
const overview = query('overview');
assert.equal(overview.counts.term, records.filter(r => r.kind === 'term').length);
assert.ok(overview.sections.length > 0);
const term = query('get', 'interest-rate');
assert.equal(term.kind, 'term');
assert.ok(term.data.description);
assert.ok(query('search', '금리').total > 0);
assert.ok(query('search', 'INTEREST-RATE').total > 0);
assert.equal(query('search', 'does-not-exist-xyz').total, 0);
const context = query('context', 'interest-rate', '2');
assert.equal(context.incoming.items.length, 2);
assert.ok(context.incoming.hasMore);
assert.notDeepEqual(query('context', 'interest-rate', '2', '2').incoming.items, context.incoming.items);
assert.equal(query('context', 'interest-rate', '2', '99999').incoming.items.length, 0);
for (const r of records) {
  const result = query('get', r.id);
  assert.equal(result.id, r.id);
  assert.equal(result.file, r.file);
}
const part = records.find(r => r.kind === 'part');
assert.ok(query('context', part.id, '100').incoming.items.some(r => r.id === part.sectionId));
const relation = records.find(r => r.kind === 'relation');
assert.deepEqual(query('context', relation.id).outgoing.items.map(r => r.id).sort(), [relation.data.term1Id, relation.data.term2Id].sort());
assert.throws(() => query('get', 'missing-id'));
assert.throws(() => query('search', ''));
assert.throws(() => query('search', '금리', '0'));
assert.throws(() => query('context', 'interest-rate', '5', '-1'));
const script = fileURLToPath(new URL('./ai-context.js', import.meta.url));
const cli = spawnSync(process.execPath, [script, 'get', 'interest-rate'], { encoding: 'utf8', cwd: path.dirname(script) });
assert.equal(cli.status, 0, cli.stderr);
assert.equal(JSON.parse(cli.stdout).id, 'interest-rate');
const missing = spawnSync(process.execPath, [script, 'get', 'missing-id'], { encoding: 'utf8' });
assert.equal(missing.status, 1);
const root = fileURLToPath(new URL('../', import.meta.url));
const documents = ['AGENTS.md', 'docs/ai-map.md', 'docs/agent-recipes.md', 'docs/add_terms.md',
  'docs/learning-authoring.md', 'docs/data-quality.md', 'docs/topic-review.md',
  'docs/agent-data-guide.md', 'docs/agent-propositions-guide.md', 'docs/data-schema.md'];
for (const file of documents) {
  const full = path.join(root, file);
  for (const match of fs.readFileSync(full, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    assert.ok(fs.existsSync(path.resolve(path.dirname(full), target)), `${file}: broken link ${target}`);
  }
}
console.log(`AI context checks passed: ${records.length} exact records, references, search, pagination, invalid input.`);
