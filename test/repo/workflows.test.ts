import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8');
const jobs = deploy.split(/\n  (?=preview:|production:)/);
const preview = jobs.find((j) => j.startsWith('preview:'))!;

describe('deploy workflow', () => {
  it('only deploys previews for branches of this repository', () => {
    expect(preview).toContain('github.event.workflow_run.head_repository.full_name == github.repository');
  });
  it('never puts a branch name straight into a shell command', () => {
    for (const line of deploy.split('\n').filter((l) => l.includes('run:'))) expect(line).not.toMatch(/\$\{\{[^}]*head_branch/);
  });
  it('does not rebuild pull-request code next to the deploy secrets', () => {
    expect(preview).not.toMatch(/npm (ci|install|run)/);
    expect(preview).toContain('actions/download-artifact');
  });
  it('refuses to publish a preview to the main branch', () => {
    expect(preview).toMatch(/main/);
    expect(preview).toContain('exit 1');
  });
});

describe('production build script', () => {
  const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>;
  it('runs through npm run build so the pre- and post-build steps run', () => {
    expect(scripts['build:production']).toMatch(/CLAFINA_BUILD=production npm run build/);
  });
  it('checks content, output and links on the production output', () => {
    for (const step of ['check:production', 'check:content', 'check:output', 'check:links']) expect(scripts['build:production']).toContain(step);
  });
});
