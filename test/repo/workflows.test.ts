import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8');
const jobs = deploy.split(/\n  (?=preview:|staging:|production:)/);
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

describe('staging', () => {
  const staging = jobs.find((j) => j.startsWith('staging:'))!;
  it('publishes every passing main to the staging branch, never to production', () => {
    expect(staging).toContain("github.event.workflow_run.head_branch == 'main'");
    expect(staging).toContain("github.event.workflow_run.conclusion == 'success'");
    expect(staging).toContain('ref: ${{ github.event.workflow_run.head_sha }}');
    expect(staging).toContain('--branch staging');
    expect(staging).not.toContain('--branch main');
  });
  it('keeps staging out of search engines', () => {
    expect(staging).toContain('X-Robots-Tag: noindex');
    expect(staging).toContain('Disallow: /');
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

describe('production release', () => {
  const production = jobs.find((j) => j.startsWith('production:'))!;
  it('runs only by hand, from main, once switched on, and waits for approval', () => {
    expect(deploy).toContain('workflow_dispatch:');
    expect(production).toContain("github.event_name == 'workflow_dispatch'");
    expect(production).toContain("github.ref == 'refs/heads/main'");
    expect(production).toContain("vars.CLAFINA_PRODUCTION_ENABLED == 'true'");
    expect(production).toContain('environment: production');
  });
  it('tests and builds in production mode before it deploys', () => {
    expect(production.indexOf('npm test')).toBeLessThan(production.indexOf('pages deploy'));
    expect(production.indexOf('build:production')).toBeLessThan(production.indexOf('pages deploy'));
  });
  it('never runs from a pull request or a workflow_run', () => {
    expect(production).not.toContain("event == 'pull_request'");
    expect(production).not.toContain('workflow_run.head_sha');
  });
});

describe('job conditions', () => {
  it('never end with a dangling && or ||', () => {
    for (const m of deploy.matchAll(/if: >-\n((?: {6}.*\n)+)/g)) expect(m[1]!.trim()).not.toMatch(/(&&|\|\|)$/);
  });
});
