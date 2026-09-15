import fs from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import ts from 'typescript';
import yaml from 'js-yaml';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, file) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } });
  module._compile(outputText, file);
};
const { createGraphIndex, getConnections, connectionGroup, placeConnections } = require('../src/utils/graphExplorer.ts');
const read = name => yaml.load(fs.readFileSync(new URL(`../src/data/${name}.yaml`, import.meta.url), 'utf8'));
const { terms } = read('terms-all');
const { relations } = read('relations');
const index = createGraphIndex(terms, relations);
const before = performance.now();
let maximum = 0;
for (const term of terms) {
  const all = getConnections(index, term.id);
  maximum = Math.max(maximum, all.length);
  assert.equal(new Set(all.map(c => c.term.id)).size, all.length);
  for (const c of all) for (const r of c.relations) {
    assert.ok([r.term1Id, r.term2Id].includes(term.id));
    assert.ok([r.term1Id, r.term2Id].includes(c.term.id));
  }
  const small = placeConnections(all.slice(0, 12));
  const expanded = placeConnections(all.slice(0, 24));
  assert.ok(small.length <= 12);
  assert.deepEqual(small, expanded.slice(0, small.length), 'Expanding must not move existing nodes');
}
const duration = performance.now() - before;
const base = { id: 'r-test', term1Id: 'a', term2Id: 'b', type: 'proportional' };
assert.equal(connectionGroup([base], 'a'), 'related');
assert.equal(connectionGroup([{ ...base, nature: 'causal' }], 'a'), 'outgoing');
assert.equal(connectionGroup([{ ...base, nature: 'policy' }], 'b'), 'incoming');
for (const nature of ['definitional', 'hierarchical', 'correlational']) assert.equal(connectionGroup([{ ...base, nature }], 'a'), 'related');
assert.equal(connectionGroup([{ ...base, nature: 'causal', bidirectional: true }], 'a'), 'related');
assert.equal(connectionGroup([{ ...base, nature: 'causal' }, { ...base, nature: 'causal', term1Id: 'b', term2Id: 'a' }], 'a'), 'related');
const connections = getConnections(index, 'interest-rate');
const preferred = connections[connections.length - 1].term.id;
assert.equal(getConnections(index, 'interest-rate', [preferred])[0].term.id, preferred);
assert.deepEqual(getConnections(index, 'missing-id'), []);
const synthetic = createGraphIndex([{ id: 'a' }, { id: 'b' }], [base, { ...base, id: 'r2', term2Id: 'missing' }]);
assert.equal(getConnections(synthetic, 'a').length, 1);
const Graph = require('../src/components/RelationGraph.tsx').default;
const html = renderToStaticMarkup(React.createElement(Graph));
assert.ok(html.includes('경제 개념 지도'));
assert.ok(html.includes('주제 지도'));
assert.ok(html.includes('용어 24개 더 보기'));
assert.ok(!html.includes('<canvas'));
const source = fs.readFileSync(new URL('../src/components/RelationGraph.tsx', import.meta.url), 'utf8');
assert.ok(!/requestAnimationFrame|setInterval|cytoscape/.test(source));
console.log(`Graph checks passed: ${terms.length} centers / ${relations.length} relations; at most 12 initial neighbors, stable expansion, direction safety, SSR.`);
console.log(`All-center retrieval + assertions: ${duration.toFixed(1)}ms; largest neighborhood ${maximum}. This is a Node benchmark, not browser FPS.`);
