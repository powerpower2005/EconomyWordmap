// Small regressions for library rendering and optional reading persistence.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    module._compile(outputText, filename);
  };
}
const stored = new Map();
globalThis.localStorage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
const { loadReadingState, saveReadingState, loadReaderPreference, saveReaderPreference } = require('../src/utils/readingState.ts');
assert.equal(loadReadingState(), null);
const position = { sectionId: 'sec-rate-transmission', partId: 'part-rate-credit-equity' };
saveReadingState(position);
assert.deepEqual(loadReadingState(), position);
stored.set('wordmap-reader-v1', '{bad');
assert.equal(loadReadingState(), null);
stored.set('wordmap-reader-v1', JSON.stringify({ sectionId: 12, partId: {} }));
assert.equal(loadReadingState(), null);
saveReaderPreference('format', 'prose');
assert.equal(loadReaderPreference('format', 'dialogue'), 'prose');
stored.clear();
const Learning = require('../src/pages/Learning.tsx').default;
const html = renderToStaticMarkup(React.createElement(Learning, { onOpenTerm() {} }));
assert.ok(html.includes('뉴스 속 숫자를,'));
assert.equal((html.match(/class="story-card"/g) || []).length, 11);
assert.ok(html.includes('학습 주제·용어·명제 검색'));
assert.ok(html.includes('처음이라면 여기부터'));
saveReadingState(position);
const resumed = renderToStaticMarkup(React.createElement(Learning, { onOpenTerm() {} }));
assert.ok(resumed.includes('읽던 곳으로'));
assert.ok(resumed.includes('3. 인하가 대출과 주식에 도착하기까지'));
globalThis.localStorage = { getItem() { throw new Error('disabled'); }, setItem() { throw new Error('disabled'); } };
assert.equal(loadReadingState(), null);
assert.doesNotThrow(() => saveReadingState(position));
assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(Learning, { onOpenTerm() {} })));
console.log('Learning UI checks passed: 11 stories, search label, resume position, corrupt/disabled storage.');
