const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const targetUrl = process.argv[2] || 'http://localhost:3005';
const outputDir = path.resolve(__dirname, '..', 'qa', 'lighthouse');
const outputPath = path.join(outputDir, 'report.html');

fs.mkdirSync(outputDir, { recursive: true });

const cliPath = require.resolve('lighthouse/cli/index.js');
const result = spawnSync(process.execPath, [
  cliPath,
  targetUrl,
  '--output=html',
  `--output-path=${outputPath}`,
  '--chrome-flags=--headless --disable-gpu --disable-dev-shm-usage --no-sandbox --no-first-run --no-default-browser-check',
  '--quiet',
], { stdio: 'inherit' });

if (result.error) throw result.error;
process.exit(result.status ?? 1);
