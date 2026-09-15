// Regression check using the application's real Markdown renderer, without a browser.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import yaml from 'js-yaml';

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../src/components/MarkdownProse.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, module, module.exports);
const render = (text, mode) => renderToStaticMarkup(React.createElement(module.exports.default, { source: text, mode }));
const sample = '**Alice:** A **bold** question.\n\n---\n\n**Bob:** An answer.';
const dialogue = render(sample, 'dialogue');
assert.equal((dialogue.match(/class="learn-dialogue__speaker /g) || []).length, 2);
assert.ok(dialogue.includes('learn-panel-break'));
assert.ok(dialogue.includes('<strong class="font-semibold text-gray-900">bold</strong>'));
assert.ok(!render(sample, 'prose').includes('learn-dialogue'));
assert.ok(!render('**Ordinary bold text** is not a speaker.', 'dialogue').includes('learn-dialogue'));

const { curriculum } = yaml.load(fs.readFileSync(new URL('../src/data/curriculum.yaml', import.meta.url), 'utf8'));
let count = 0;
for (const section of curriculum.sections) {
  for (const item of [section, ...section.parts]) {
    for (const [field, mode] of [['bodyDialogue', 'dialogue'], ['bodyProse', 'prose']]) {
      if (!item[field]) continue;
      const html = render(item[field], mode);
      assert.ok(!html.includes('**'), `${item.id}/${mode}: unrendered bold delimiters`);
      if (mode === 'dialogue' && item[field].includes('**Alice:**')) {
        assert.ok(html.includes('learn-dialogue__speaker'), `${item.id}: missing speaker bubble`);
      }
      if (mode === 'prose') assert.ok(!html.includes('learn-dialogue__speaker'), `${item.id}: dialogue in prose mode`);
      count++;
    }
  }
}
console.log(`Learning render check passed: ${count} bodies, speaker bubbles, panel breaks, and prose mode.`);
