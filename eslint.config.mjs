import next from 'eslint-config-next';

const config = [
  { ignores: ['out/**', '.next/**', 'node_modules/**', 'brand/**', 'docs/**', 'assets/**', '.superpowers/**', 'test-results/**', 'playwright-report/**'] },
  ...next,
];

export default config;
