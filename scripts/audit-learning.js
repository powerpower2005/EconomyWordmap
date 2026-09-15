// Read-only structural audit. Economic meaning and prose still require review.
import fs from 'node:fs';
import yaml from 'js-yaml';

const read = name => yaml.load(fs.readFileSync(new URL(`../src/data/${name}.yaml`, import.meta.url), 'utf8'));
const { terms } = read('terms-all');
const { relations } = read('relations');
const { propositions } = read('propositions');
const { curriculum } = read('curriculum');
const termsById = new Map(terms.map(t => [t.id, t]));
const relationsById = new Map(relations.map(r => [r.id, r]));
const propositionsById = new Map(propositions.map(p => [p.id, p]));
const errors = [];
const unique = (values, label) => {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) errors.push(`${label}: duplicate ${value}`);
    seen.add(value);
  }
};
const refs = (values, index, label) => {
  unique(values, label);
  for (const value of values) if (!index.has(value)) errors.push(`${label}: missing ${value}`);
};
unique(terms.map(t => t.id), 'terms');
unique(relations.map(r => r.id), 'relations');
unique(propositions.map(p => p.id), 'propositions');
unique(relations.map(r => [r.term1Id, r.term2Id].sort().join('|')), 'relation pairs');
unique(propositions.map(p => p.statement.trim()), 'proposition statements');
unique(curriculum.sections.map(s => s.id), 'sections');
unique(curriculum.sections.map(s => s.order), 'section order');
unique(curriculum.sections.flatMap(s => s.parts.map(p => p.id)), 'parts');
const adjacency = new Map(terms.map(t => [t.id, new Set()]));
for (const r of relations) {
  refs([r.term1Id, r.term2Id], termsById, r.id);
  adjacency.get(r.term1Id)?.add(r.term2Id);
  adjacency.get(r.term2Id)?.add(r.term1Id);
  if (r.bidirectional && !r.reverseDescription) errors.push(`${r.id}: missing reverse description`);
}
for (const p of propositions) {
  refs(p.termIds || [], termsById, p.id);
  refs(p.relationIds || [], relationsById, p.id);
  if (!p.holds?.length || !p.fails?.length || !p.premise || !p.verdict) errors.push(`${p.id}: incomplete conditional claim`);
}
const coveredTerms = new Set();
const coveredProps = new Set();
const denseParts = [];
const proseWarnings = [];
const sections = [];
for (const s of curriculum.sections) {
  const sectionTerms = new Set();
  const sectionProps = new Set();
  for (const p of [s, ...s.parts]) {
    if (s.bodyDialogue && s.bodyProse && (!p.bodyDialogue?.trim() || !p.bodyProse?.trim())) errors.push(`${p.id}: incomplete dual mode`);
    if (/섹션|파트|그래프에서|아래에서|위에서|\*\*정리(?:하면)?:/.test(p.bodyDialogue || '')) proseWarnings.push(`${p.id}: dialogue may break the fourth wall`);
  }
  for (const p of s.parts) {
    refs(p.termIds || [], termsById, p.id);
    refs(p.propositionIds || [], propositionsById, p.id);
    for (const id of p.termIds || []) { coveredTerms.add(id); sectionTerms.add(id); }
    for (const id of p.propositionIds || []) { coveredProps.add(id); sectionProps.add(id); }
    if ((p.termIds?.length || 0) > 20 || (p.propositionIds?.length || 0) > 10) denseParts.push({ id: p.id, terms: p.termIds?.length || 0, propositions: p.propositionIds?.length || 0 });
  }
  sections.push({ id: s.id, order: s.order, parts: s.parts.length, terms: sectionTerms.size, propositions: sectionProps.size });
}
const unseen = new Set(terms.map(t => t.id));
const components = [];
while (unseen.size) {
  const stack = [unseen.values().next().value];
  unseen.delete(stack[0]);
  let size = 0;
  while (stack.length) {
    const id = stack.pop(); size++;
    for (const next of adjacency.get(id) || []) if (unseen.delete(next)) stack.push(next);
  }
  components.push(size);
}
console.log(JSON.stringify({
  counts: { terms: terms.length, relations: relations.length, propositions: propositions.length, sections: sections.length, parts: sections.reduce((n, s) => n + s.parts, 0), coveredTerms: coveredTerms.size, coveredPropositions: coveredProps.size },
  errors, components: components.sort((a, b) => b - a),
  orphanTerms: terms.filter(t => !adjacency.get(t.id)?.size).map(t => t.id),
  sections: sections.sort((a, b) => a.order - b.order), denseParts, proseWarnings,
  uncoveredImportantTerms: terms.filter(t => t.stockMarketImportance >= 5 && !coveredTerms.has(t.id)).map(t => t.id),
  uncoveredPropositions: propositions.filter(p => !coveredProps.has(p.id)).map(p => ({ id: p.id, statement: p.statement })),
}, null, 2));
process.exitCode = errors.length ? 1 : 0;
