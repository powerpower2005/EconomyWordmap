import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function convertYamlToJson() {
  const dataDir = join(__dirname, 'src/data');
  
  try {
    // terms-all.yaml을 JSON으로 변환
    if (fs.existsSync(join(dataDir, 'terms-all.yaml'))) {
      const yamlContent = fs.readFileSync(join(dataDir, 'terms-all.yaml'), 'utf8');
      const jsonData = yaml.load(yamlContent);
      fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(jsonData, null, 2), 'utf8');
    }
    
    // relations.yaml을 JSON으로 병합
    if (fs.existsSync(join(dataDir, 'relations.yaml'))) {
      const yamlContent = fs.readFileSync(join(dataDir, 'relations.yaml'), 'utf8');
      const relationsData = yaml.load(yamlContent);
      
      if (fs.existsSync(join(dataDir, 'terms.json'))) {
        const termsData = JSON.parse(fs.readFileSync(join(dataDir, 'terms.json'), 'utf8'));
        const merged = { ...termsData, ...relationsData };
        fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(merged, null, 2), 'utf8');
      } else {
        fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(relationsData, null, 2), 'utf8');
      }
    }
  } catch (error) {
    console.error('YAML to JSON 변환 실패:', error);
  }
}

export default function vitePluginYamlToJson() {
  return {
    name: 'vite-plugin-yaml-to-json',
    buildStart() {
      convertYamlToJson();
    },
    handleHotUpdate({ file }) {
      // YAML 파일이 변경되면 JSON 재생성
      if (file.includes('src/data') && (file.endsWith('.yaml') || file.endsWith('.yml'))) {
        convertYamlToJson();
      }
    }
  };
}
