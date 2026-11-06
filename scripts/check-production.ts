import { productionProblems } from '../src/config/switches';
import { settingsProblems } from '../src/config/site';
import { legalDrafts } from '../src/lib/docs';

const problems = [...productionProblems(), ...settingsProblems(), ...legalDrafts()];
if (problems.length) {
  console.error('Production build blocked. Fix these in src/config/switches.ts, src/config/site.ts and the legal pages:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('Production switches and settings are ready.');
