import { convertYamlToJson } from './scripts/data-build.js';

export default function vitePluginYamlToJson() {
  return {
    name: 'vite-plugin-yaml-to-json',
    buildStart() {
      convertYamlToJson();
    },
    handleHotUpdate({ file }) {
      if (file.includes('src/data') && (file.endsWith('.yaml') || file.endsWith('.yml'))) {
        convertYamlToJson();
      }
    },
  };
}
