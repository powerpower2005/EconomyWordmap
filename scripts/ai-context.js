// Read-only retrieval from canonical YAML, independent of generated JSON/Git history.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import yaml from 'js-yaml';

export function loadRecords() {
  const read = file => yaml.load(fs.readFileSync(new URL(`../src/data/${file}`, import.meta.url), 'utf8'));
  const groups = [
    ['term', 'terms-all.yaml', read('terms-all.yaml').terms],
    ['relation', 'relations.yaml', read('relations.yaml').relations],
    ['proposition', 'propositions.yaml', read('propositions.yaml').propositions],
    ['section', 'curriculum.yaml', read('curriculum.yaml').curriculum.sections],
  ];
  return groups.flatMap(([kind, file, items]) => items.flatMap(data => {
    const record = { kind, file: `src/data/${file}`, id: data.id, data };
    return kind === 'section' ? [record, ...data.parts.map(part => ({
      kind: 'part', file: record.file, id: part.id, sectionId: data.id, data: part,
    }))] : [record];
  }));
}

const brief = record => ({
  kind: record.kind, file: record.file, id: record.id,
  ...(record.sectionId ? { sectionId: record.sectionId } : {}),
  label: record.data.name || record.data.statement || record.data.title || `${record.data.term1Id} → ${record.data.term2Id}`,
  ...(record.kind === 'relation' ? { term1Id: record.data.term1Id, term2Id: record.data.term2Id, bidirectional: !!record.data.bidirectional } : {}),
});

export function queryRecords(records, args) {
  const [command = 'overview', value, limitText = '20', offsetText = '0'] = args;
  const limit = Number(limitText), offset = Number(offsetText);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error('limit must be 1..100; offset must be a non-negative integer');
  }
  const page = items => ({ total: items.length, offset, limit,
    hasMore: offset + limit < items.length, items: items.slice(offset, offset + limit).map(brief) });
  if (command === 'overview') return {
    counts: Object.fromEntries(['term', 'relation', 'proposition', 'section', 'part'].map(kind => [kind, records.filter(r => r.kind === kind).length])),
    sections: records.filter(r => r.kind === 'section').sort((a, b) => a.data.order - b.data.order).map(r => ({ ...brief(r), order: r.data.order, parts: r.data.parts.map(p => ({ id: p.id, title: p.title })) })),
  };
  if (!value?.trim()) throw new Error('Provide a search phrase or exact ID');
  if (command === 'search') {
    const needle = value.toLocaleLowerCase();
    // Search all text fields, but do not duplicate chapter matches in section bodies.
    return page(records.filter(r => {
      const { parts, ...ownFields } = r.data;
      return JSON.stringify(ownFields).toLocaleLowerCase().includes(needle);
    }));
  }
  if (!['get', 'context'].includes(command)) throw new Error('Commands: overview | search <text> [limit] [offset] | get <id> | context <id> [limit] [offset]');
  const matches = records.filter(r => r.id === value);
  if (matches.length !== 1) throw new Error(matches.length ? `Ambiguous ID: ${value}` : `Unknown ID: ${value}`);
  const record = matches[0];
  if (command === 'get') return record;
  // Explicit reference links only. A co-mention is not a causal relation.
  const outgoing = new Set();
  const incoming = new Set();
  const connect = (from, to) => {
    if (from === value) outgoing.add(to);
    if (to === value) incoming.add(from);
  };
  for (const r of records) {
    for (const id of [...(r.data.termIds || []), ...(r.data.propositionIds || []), ...(r.data.relationIds || [])]) connect(r.id, id);
    if (r.kind === 'relation') {
      connect(r.id, r.data.term1Id); connect(r.id, r.data.term2Id);
    }
    if (r.kind === 'section') for (const part of r.data.parts) connect(r.id, part.id);
  }
  return { record, outgoing: page(records.filter(r => outgoing.has(r.id))), incoming: page(records.filter(r => incoming.has(r.id))),
    note: 'Explicit references, not inferred causality. Read complete records with get. Page each list using offset; inspect relation direction and conditions in the source.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(queryRecords(loadRecords(), process.argv.slice(2)), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
