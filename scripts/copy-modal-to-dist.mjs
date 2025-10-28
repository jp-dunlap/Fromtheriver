import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const distModal = path.join(root, 'dist-modal');

async function main() {
  try {
    await fs.mkdir(dist, { recursive: true });
    const entries = await fs.readdir(distModal, { withFileTypes: true });
    const modalFiles = entries
      .filter((entry) => entry.isFile() && entry.name.startsWith('codex-modal-host.'))
      .map((entry) => entry.name);

    if (modalFiles.length === 0) {
      console.error('[copy-modal] No codex-modal-host.* artifacts found in dist-modal');
      process.exit(1);
    }

    for (const file of modalFiles) {
      await fs.copyFile(path.join(distModal, file), path.join(dist, file));
      console.log(`[copy-modal] ${path.join('dist-modal', file)} -> ${path.join('dist', file)}`);
    }
  } catch (err) {
    console.error('[copy-modal] failed:', err);
    process.exit(1);
  }
}

await main();
