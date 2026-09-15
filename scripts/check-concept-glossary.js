// Exercise the real glossary/claim renderers with isolated data and bookmark hooks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const terms = { rate: { id: 'rate', name: '금리', description: '돈을 빌리는 비용' } };
function load(name, overrides = {}) {
  const source = fs.readFileSync(new URL(`../src/components/${name}.tsx`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(id => overrides[id] ?? require(id), mod, mod.exports);
  return mod.exports.default;
}
const markdown = { default: ({ source }) => React.createElement('p', null, source) };
const Glossary = load('ConceptGlossary', {
  '../utils/dataLoader': { getTermById: id => terms[id] },
  '../hooks/useLearnedItems': { useLearnedItems: () => ({ isLearned: () => false, toggleLearned() {} }) },
  './MarkdownProse': markdown,
  './LearnedToggle': { default: () => null },
});
const render = props => renderToStaticMarkup(React.createElement(Glossary, props));
assert.equal(render({ termIds: [], context: '' }), '');
assert.equal(render({ termIds: ['missing'], context: '' }), '');
const html = render({ termIds: ['rate', 'rate', 'missing'], context: '명제' });
assert.equal((html.match(/<button/g) || []).length, 1, 'deduplicate and ignore missing references');
assert.ok(html.includes('금리') && html.includes('aria-expanded="false"'));
assert.ok(!html.includes('concept-definition"'), 'definitions are collapsed initially');
const Body = load('PropositionBody', { './ConceptGlossary': { default: Glossary }, './MarkdownProse': markdown });
const body = renderToStaticMarkup(React.createElement(Body, { proposition: {
  id: 'p-test', statement: '금리와 주가', termIds: ['rate'], premise: '논리 내용',
  holds: [], fails: [], verdict: '조건부 결론',
} }));
assert.ok(body.includes('금리') && body.includes('논리 내용') && body.includes('조건부 결론'));
assert.ok(body.indexOf('concept-glossary') < body.indexOf('논리 내용'));
console.log('Concept glossary checks passed: dedupe, missing references, optional graph callback, collapsed state, claim integration.');
