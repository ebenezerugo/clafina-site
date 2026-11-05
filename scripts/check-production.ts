import { productionProblems } from '../src/config/switches';
import { settingsProblems } from '../src/config/site';

const problems = [...productionProblems(), ...settingsProblems()];
if (problems.length) {
  console.error('Production build blocked. Fix these in src/config/switches.ts and src/config/site.ts:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('Production switches and settings are ready.');
