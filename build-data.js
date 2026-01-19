import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// YAML 파일들을 JSON으로 변환
function convertYamlToJson() {
  const dataDir = join(__dirname, 'src/data');
  
  // terms-all.yaml을 JSON으로 변환
  if (fs.existsSync(join(dataDir, 'terms-all.yaml'))) {
    const yamlContent = fs.readFileSync(join(dataDir, 'terms-all.yaml'), 'utf8');
    const jsonData = yaml.load(yamlContent);
    fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('✅ terms-all.yaml → terms.json 변환 완료');
  }
  
  // relations.yaml을 JSON으로 변환
  if (fs.existsSync(join(dataDir, 'relations.yaml'))) {
    const yamlContent = fs.readFileSync(join(dataDir, 'relations.yaml'), 'utf8');
    const jsonData = yaml.load(yamlContent);
    // 기존 terms.json과 병합
    if (fs.existsSync(join(dataDir, 'terms.json'))) {
      const termsData = JSON.parse(fs.readFileSync(join(dataDir, 'terms.json'), 'utf8'));
      const merged = { ...termsData, ...jsonData };
      fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(merged, null, 2), 'utf8');
      console.log('✅ relations.yaml → terms.json 병합 완료');
    } else {
      fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(jsonData, null, 2), 'utf8');
    }
  }
}

convertYamlToJson();
