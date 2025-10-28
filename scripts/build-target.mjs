import { build } from 'vite';

const target = process.argv[2];

if (!target) {
  console.error('Usage: node scripts/build-target.mjs <app|modal>');
  process.exit(1);
}

if (!['app', 'modal'].includes(target)) {
  console.error(`Unknown build target: ${target}`);
  process.exit(1);
}

process.env.BUILD_TARGET = target;

try {
  await build({ configFile: 'vite.config.ts' });
} catch (error) {
  console.error(error);
  process.exit(1);
}
