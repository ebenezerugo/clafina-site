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
  it('builds a preview only from the exact commit CI checked, of a branch in this repository', () => {
    // Forks are excluded above, so only people who can push here can put code next to the deploy secrets,
    // the same trust the production job relies on.
    expect(preview).toContain('ref: ${{ github.event.workflow_run.head_sha }}');
    expect(preview).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(preview).toContain('persist-credentials: false');
  });
  it('refuses to publish a preview to the main branch', () => {
    expect(preview).toMatch(/main/);
    expect(preview).toContain('exit 1');
  });
});

describe('CI artifacts', () => {
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
  it('stores no copy of the site, so artifact storage cannot block a preview', () => {
    expect(ci).not.toMatch(/name: site/);
  });
  it('keeps test reports only when something failed, briefly', () => {
    expect(ci).toContain('if: failure()');
    expect(ci).toMatch(/retention-days: \d/);
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
