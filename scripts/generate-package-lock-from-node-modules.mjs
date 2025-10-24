import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, 'package.json');
const nodeModulesLockPath = path.join(rootDir, 'node_modules', '.package-lock.json');
const outputPath = path.join(rootDir, 'package-lock.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('package.json not found.');
  process.exit(1);
}

if (!fs.existsSync(nodeModulesLockPath)) {
  console.error('node_modules/.package-lock.json not found.');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const lock = JSON.parse(fs.readFileSync(nodeModulesLockPath, 'utf8'));

lock.name = pkg.name;
lock.version = pkg.version;

if (!lock.packages) {
  console.error('Unexpected lockfile structure: missing packages map.');
  process.exit(1);
}

const rootPackageEntry = {
  name: pkg.name,
  version: pkg.version,
};

if (pkg.license) {
  rootPackageEntry.license = pkg.license;
}

if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  rootPackageEntry.dependencies = { ...pkg.dependencies };
}

if (pkg.devDependencies && Object.keys(pkg.devDependencies).length > 0) {
  rootPackageEntry.devDependencies = { ...pkg.devDependencies };
}

lock.packages[''] = rootPackageEntry;

const cleanRange = (range) => {
  if (typeof range !== 'string') return range;
  const simpleMatch = range.match(/^(?:[\^~]|>=)?(\d+\.\d+\.\d+)/);
  if (simpleMatch) {
    return simpleMatch[1];
  }
  return range;
};

const buildTopLevelDependencyMap = (names, { dev }) => {
  if (!names || Object.keys(names).length === 0) return undefined;
  const result = {};
  for (const [depName, range] of Object.entries(names)) {
    const packageKey = path.posix.join('node_modules', depName);
    const info = lock.packages[packageKey];
    const entry = {};
    if (info) {
      entry.version = info.version;
      if (info.resolved) entry.resolved = info.resolved;
      if (info.integrity) entry.integrity = info.integrity;
      if (info.dependencies && Object.keys(info.dependencies).length > 0) {
        entry.requires = { ...info.dependencies };
      }
      if (info.optional) entry.optional = info.optional;
      if (info.peer) entry.peer = info.peer;
    } else {
      entry.version = cleanRange(range);
    }
    if (dev) entry.dev = true;
    result[depName] = entry;
  }
  return result;
};

const prodDeps = buildTopLevelDependencyMap(pkg.dependencies, { dev: false });
const devDeps = buildTopLevelDependencyMap(pkg.devDependencies, { dev: true });

if (prodDeps) {
  lock.dependencies = prodDeps;
} else {
  delete lock.dependencies;
}

if (devDeps) {
  lock.devDependencies = devDeps;
} else {
  delete lock.devDependencies;
}

fs.writeFileSync(outputPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
console.log(`package-lock.json generated at ${outputPath}`);
