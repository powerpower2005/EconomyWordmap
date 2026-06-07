import fs from 'fs';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'src/data');

function loadYaml(path) {
  return yaml.load(fs.readFileSync(path, 'utf8'));
}

function validate() {
  const errors = [];
  const warnings = [];

  const termsPath = join(DATA_DIR, 'terms-all.yaml');
  const relationsPath = join(DATA_DIR, 'relations.yaml');

  if (!fs.existsSync(termsPath)) {
    console.error('❌ terms-all.yaml not found');
    process.exit(1);
  }

  const termsData = loadYaml(termsPath);
  const terms = termsData?.terms || [];
  const termIds = new Set();
  const termIdCounts = new Map();

  for (const term of terms) {
    if (!term.id) {
      errors.push('Term missing id');
      continue;
    }
    termIdCounts.set(term.id, (termIdCounts.get(term.id) || 0) + 1);
    termIds.add(term.id);
    if (!term.name) errors.push(`Term "${term.id}" missing name`);
    if (!term.description) warnings.push(`Term "${term.id}" missing description`);
    if (term.stockMarketImportance !== undefined) {
      const imp = term.stockMarketImportance;
      if (!Number.isInteger(imp) || imp < 1 || imp > 10) {
        errors.push(`Term "${term.id}": stockMarketImportance must be an integer 1-10 (got ${imp})`);
      }
    } else {
      warnings.push(`Term "${term.id}" missing stockMarketImportance`);
    }
  }

  for (const [id, count] of termIdCounts) {
    if (count > 1) errors.push(`Duplicate term id: ${id} (${count} times)`);
  }

  if (!fs.existsSync(relationsPath)) {
    warnings.push('relations.yaml not found');
    printResults(errors, warnings);
    process.exit(errors.length > 0 ? 1 : 0);
  }

  const relationsData = loadYaml(relationsPath);
  const relations = relationsData?.relations || [];
  const relationIdCounts = new Map();
  const orphanRelationIds = new Set();
  const orphanTermIds = new Set();

  for (const rel of relations) {
    if (!rel.id) {
      errors.push('Relation missing id');
      continue;
    }
    relationIdCounts.set(rel.id, (relationIdCounts.get(rel.id) || 0) + 1);

    if (!rel.term1Id || !rel.term2Id) {
      errors.push(`Relation "${rel.id}" missing term1Id or term2Id`);
      continue;
    }
    if (!termIds.has(rel.term1Id)) {
      orphanRelationIds.add(rel.id);
      orphanTermIds.add(rel.term1Id);
    }
    if (!termIds.has(rel.term2Id)) {
      orphanRelationIds.add(rel.id);
      orphanTermIds.add(rel.term2Id);
    }

    const validTypes = ['proportional', 'inverse', 'correlation'];
    if (rel.type && !validTypes.includes(rel.type)) {
      errors.push(`Relation "${rel.id}": invalid type "${rel.type}"`);
    }
    if (rel.reverseType && !validTypes.includes(rel.reverseType)) {
      errors.push(`Relation "${rel.id}": invalid reverseType "${rel.reverseType}"`);
    }

    const validNatures = ['causal', 'correlational', 'definitional', 'hierarchical', 'policy'];
    if (rel.nature && !validNatures.includes(rel.nature)) {
      errors.push(`Relation "${rel.id}": invalid nature "${rel.nature}"`);
    }

    const validStrengths = ['weak', 'medium', 'strong'];
    if (rel.strength && !validStrengths.includes(rel.strength)) {
      errors.push(`Relation "${rel.id}": invalid strength "${rel.strength}"`);
    }
    if (rel.reverseStrength && !validStrengths.includes(rel.reverseStrength)) {
      errors.push(`Relation "${rel.id}": invalid reverseStrength "${rel.reverseStrength}"`);
    }
  }

  for (const [id, count] of relationIdCounts) {
    if (count > 1) errors.push(`Duplicate relation id: ${id} (${count} times)`);
  }

  if (orphanRelationIds.size > 0) {
    warnings.push(
      `${orphanRelationIds.size} relation(s) reference ${orphanTermIds.size} term id(s) not in terms-all.yaml (legacy orphan edges). New relations must use ids from terms-all only.`
    );
  }

  let propositionCount = 0;
  const propositionsPath = join(DATA_DIR, 'propositions.yaml');
  if (fs.existsSync(propositionsPath)) {
    const propositionsData = loadYaml(propositionsPath);
    const propositions = propositionsData?.propositions || [];
    propositionCount = propositions.length;
    const propositionIdCounts = new Map();

    for (const prop of propositions) {
      if (!prop.id) {
        errors.push('Proposition missing id');
        continue;
      }
      propositionIdCounts.set(prop.id, (propositionIdCounts.get(prop.id) || 0) + 1);
      if (!prop.statement) errors.push(`Proposition "${prop.id}" missing statement`);
      if (!prop.premise) warnings.push(`Proposition "${prop.id}" missing premise`);
      if (!Array.isArray(prop.holds) || prop.holds.length === 0)
        warnings.push(`Proposition "${prop.id}" has no holds (성립) cases`);
      if (!Array.isArray(prop.fails) || prop.fails.length === 0)
        warnings.push(`Proposition "${prop.id}" has no fails (한계) cases`);
      if (!prop.verdict) warnings.push(`Proposition "${prop.id}" missing verdict`);

      const refs = Array.isArray(prop.termIds) ? prop.termIds : [];
      for (const refId of refs) {
        if (!termIds.has(refId)) {
          errors.push(`Proposition "${prop.id}" references unknown termId "${refId}"`);
        }
      }
    }

    for (const [id, count] of propositionIdCounts) {
      if (count > 1) errors.push(`Duplicate proposition id: ${id} (${count} times)`);
    }
  }

  printResults(errors, warnings, terms.length, relations.length, propositionCount);
  process.exit(errors.length > 0 ? 1 : 0);
}

function printResults(errors, warnings, termCount, relationCount, propositionCount) {
  if (warnings.length) {
    console.warn('⚠️ Warnings:');
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }
  if (errors.length) {
    console.error('❌ Validation failed:');
    errors.forEach((e) => console.error(`  - ${e}`));
  } else {
    console.log(
      `✅ Data validation passed (${termCount ?? 0} terms, ${relationCount ?? 0} relations, ${propositionCount ?? 0} propositions)`
    );
  }
}

validate();
