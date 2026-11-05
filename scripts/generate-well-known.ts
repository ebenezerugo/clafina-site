import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, fact } from '../src/config/site';
import { isOn } from '../src/config/switches';

export interface AppIds { teamId: string; bundleId: string; packageName: string; sha256Fingerprints: string[] }

export function wellKnownFilesWith(ids: AppIds): Record<string, string> {
  const aasa = { applinks: { details: [{ appIDs: [`${ids.teamId}.${ids.bundleId}`], components: [{ '/': '/open/*' }] }] } };
  const assetlinks = [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: ids.packageName, sha256_cert_fingerprints: ids.sha256Fingerprints },
  }];
  return { 'apple-app-site-association': JSON.stringify(aasa, null, 2), 'assetlinks.json': JSON.stringify(assetlinks, null, 2) };
}

/** The deep-link files, or null while deep links are off or their values are placeholders. */
export function wellKnownFiles(): Record<string, string> | null {
  if (!isOn('features.deepLinks')) return null;
  const teamId = fact(SITE.ios.teamId);
  const bundleId = fact(SITE.ios.bundleId);
  const packageName = fact(SITE.android.packageName);
  const sha256Fingerprints = fact(SITE.android.sha256Fingerprints);
  if (!teamId || !bundleId || !packageName || !sha256Fingerprints?.length) return null;
  return wellKnownFilesWith({ teamId, bundleId, packageName, sha256Fingerprints });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = join('public', '.well-known');
  const files = wellKnownFiles();
  rmSync(dir, { recursive: true, force: true });
  if (files) {
    mkdirSync(dir, { recursive: true });
    for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
    console.log('Wrote deep-link files.');
  } else {
    console.log('Deep links off or not configured: no .well-known files.');
  }
}
