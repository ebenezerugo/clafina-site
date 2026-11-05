import { describe, expect, it } from 'vitest';
import { wellKnownFiles, wellKnownFilesWith } from '../../scripts/generate-well-known';

const ids = { teamId: 'TEAM', bundleId: 'com.clafina.app', packageName: 'com.clafina.app', sha256Fingerprints: ['AA:BB'] };

describe('deep-link files', () => {
  it('writes nothing while the values are placeholders', () => {
    expect(wellKnownFiles()).toBeNull();
  });
  it('writes the iOS association for /open/ paths', () => {
    const aasa = JSON.parse(wellKnownFilesWith(ids)['apple-app-site-association']!);
    expect(aasa.applinks.details[0].appIDs).toEqual(['TEAM.com.clafina.app']);
    expect(aasa.applinks.details[0].components).toEqual([{ '/': '/open/*' }]);
  });
  it('writes the Android asset links', () => {
    const links = JSON.parse(wellKnownFilesWith(ids)['assetlinks.json']!);
    expect(links[0].target).toEqual({ namespace: 'android_app', package_name: 'com.clafina.app', sha256_cert_fingerprints: ['AA:BB'] });
  });
});
