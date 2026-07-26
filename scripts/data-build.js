import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { applyContentHistory } from './content-history.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');

export function convertYamlToJson() {
  const dataDir = join(REPO_ROOT, 'src/data');

  if (fs.existsSync(join(dataDir, 'terms-all.yaml'))) {
    const yamlContent = fs.readFileSync(join(dataDir, 'terms-all.yaml'), 'utf8');
    const jsonData = yaml.load(yamlContent);
    fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('✅ terms-all.yaml → terms.json 변환 완료');
  }

  if (fs.existsSync(join(dataDir, 'relations.yaml'))) {
    const yamlContent = fs.readFileSync(join(dataDir, 'relations.yaml'), 'utf8');
    const relationsData = yaml.load(yamlContent);

    if (fs.existsSync(join(dataDir, 'terms.json'))) {
      const termsData = JSON.parse(fs.readFileSync(join(dataDir, 'terms.json'), 'utf8'));
      const merged = { ...termsData, ...relationsData };
      fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(merged, null, 2), 'utf8');
      console.log('✅ relations.yaml → terms.json 병합 완료');
    } else {
      fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(relationsData, null, 2), 'utf8');
    }
  }

  if (fs.existsSync(join(dataDir, 'propositions.yaml'))) {
    const yamlContent = fs.readFileSync(join(dataDir, 'propositions.yaml'), 'utf8');
    const propositionsData = yaml.load(yamlContent);

    if (fs.existsSync(join(dataDir, 'terms.json'))) {
      const termsData = JSON.parse(fs.readFileSync(join(dataDir, 'terms.json'), 'utf8'));
      const merged = { ...termsData, ...propositionsData };
      fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(merged, null, 2), 'utf8');
      console.log('✅ propositions.yaml → terms.json 병합 완료');
    } else {
      fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(propositionsData, null, 2), 'utf8');
    }
  }

  if (fs.existsSync(join(dataDir, 'curriculum.yaml'))) {
    const yamlContent = fs.readFileSync(join(dataDir, 'curriculum.yaml'), 'utf8');
    const curriculumData = yaml.load(yamlContent);

    if (fs.existsSync(join(dataDir, 'terms.json'))) {
      const termsData = JSON.parse(fs.readFileSync(join(dataDir, 'terms.json'), 'utf8'));
      const merged = { ...termsData, ...curriculumData };
      fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(merged, null, 2), 'utf8');
      console.log('✅ curriculum.yaml → terms.json 병합 완료');
    } else {
      fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(curriculumData, null, 2), 'utf8');
    }
  }

  if (fs.existsSync(join(dataDir, 'terms.json'))) {
    const termsData = JSON.parse(fs.readFileSync(join(dataDir, 'terms.json'), 'utf8'));
    const stats = applyContentHistory(termsData);
    const any =
      stats.termCount +
        stats.relationCount +
        stats.propositionCount +
        stats.curriculumCount +
        stats.dateCount >
      0;
    if (any) {
      fs.writeFileSync(join(dataDir, 'terms.json'), JSON.stringify(termsData, null, 2), 'utf8');
      console.log(
        `✅ 콘텐츠 변경 이력 적용 (용어 ${stats.termCount}, 관계 ${stats.relationCount}, 명제 ${stats.propositionCount}, 학습 ${stats.curriculumCount}, 날짜 ${stats.dateCount}일)`
      );
    }
  }
}
