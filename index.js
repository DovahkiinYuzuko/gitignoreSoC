#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const GITIGNORES_DIR = path.join(ROOT, '.gitignores');
const ROOT_GITIGNORE = path.join(ROOT, '.gitignore');
const MARKER = '# ---AUTO-Generated---';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// .gitignores/ を再帰的に探索して *.gitignore ファイルを全部集める
function findGitignoreFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findGitignoreFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.gitignore')) {
      results.push(fullPath);
    }
  }

  return results;
}

function ensureGitignoresDir() {
  if (!fs.existsSync(GITIGNORES_DIR)) {
    fs.mkdirSync(GITIGNORES_DIR, { recursive: true });
    console.log(`Created empty directory: .gitignores/`);
  }
}

function build() {
  ensureGitignoresDir();

  const projectName = path.basename(ROOT);
  const base = fs.readFileSync(ROOT_GITIGNORE, 'utf-8').split(MARKER)[0].trimEnd();

  const baseWithoutProjectLine = base
    .split('\n')
    .filter(line => !line.startsWith('# project:'))
    .join('\n')
    .trimStart();

  const files = findGitignoreFiles(GITIGNORES_DIR);

  const generated = files.map(fullPath => {
    // ルートからの相対パスを見出しにする（例: .gitignores/root.gitignore）
    const relPath = path.relative(ROOT, fullPath).split(path.sep).join('/');
    const content = fs.readFileSync(fullPath, 'utf-8').trimEnd();
    return `# ${relPath}\n${content}`;
  }).join('\n');

  return `# project:${projectName}\n${baseWithoutProjectLine}\n${MARKER}\n${generated}\n`;
}

function diffLines(oldContent, newContent) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  const removed = oldLines.filter(l => !newSet.has(l));
  const added = newLines.filter(l => !oldSet.has(l));

  return { removed, added };
}

function cleanupTracked(dryRun) {
  const tracked = execSync('git ls-files', { cwd: ROOT }).toString().split('\n').filter(Boolean);
  if (tracked.length === 0) return;

  const result = execSync('git check-ignore --stdin --verbose', {
    cwd: ROOT,
    input: tracked.join('\n'),
  }).toString();

  const toRemove = result.split('\n').filter(Boolean).map(line => line.split('\t').pop());
  if (toRemove.length === 0) return;

  console.log(dryRun
    ? '\n[dry-run] Files that WOULD be removed from tracking (git rm --cached):'
    : '\nRemoving from tracking (git rm --cached):');

  toRemove.forEach(f => console.log(`${RED}- ${f}${RESET}`));

  if (!dryRun) {
    execSync(`git rm --cached ${toRemove.map(f => `"${f}"`).join(' ')}`, { cwd: ROOT });
  }
}

// mushi --list: .gitignores/ 配下の断片ファイル一覧を見せるだけ
function listFragments() {
  ensureGitignoresDir();
  const files = findGitignoreFiles(GITIGNORES_DIR);

  if (files.length === 0) {
    console.log('No .gitignore fragments found in .gitignores/');
    return;
  }

  console.log(`Found ${files.length} fragment(s):\n`);
  files.forEach(fullPath => {
    const relPath = path.relative(ROOT, fullPath).split(path.sep).join('/');
    const content = fs.readFileSync(fullPath, 'utf-8').trim();
    const lineCount = content ? content.split('\n').length : 0;
    console.log(`${CYAN}${relPath}${RESET} (${lineCount} line${lineCount === 1 ? '' : 's'})`);
  });
}

// mushi init: 初回セットアップ
function init() {
  ensureGitignoresDir();

  if (fs.existsSync(ROOT_GITIGNORE)) {
    console.log('.gitignore already exists. Skipping template creation.');
  } else {
    const template = `*\n!.gitignore\n${MARKER}\n`;
    fs.writeFileSync(ROOT_GITIGNORE, template);
    console.log('Created .gitignore with whitelist template.');
  }

  console.log('\nSetup complete. Add fragment files under .gitignores/ (e.g. .gitignores/root.gitignore) and run `mushi` to build.');
}

// mushi --help: usage
function printHelp() {
  console.log(`mushi — split-manage .gitignore fragments and merge them into one

Usage:
  mushi init          Create .gitignores/ and a whitelist-style .gitignore template
  mushi               Merge all fragments into .gitignore and clean up tracked files
  mushi --dry-run     Preview the merge and cleanup without writing anything
  mushi --list        List fragment files under .gitignores/ with their line counts
  mushi --help        Show this help message

Examples:
  mushi init
  mushi --list
  mushi --dry-run
  mushi

Notes:
  - Fragments live under .gitignores/ as {name}.gitignore, nested folders are fine.
  - Everything below the "${MARKER}" marker in the root .gitignore is auto-generated; don't edit it by hand.
  - After merging, files newly matched by ignore rules are removed from Git's index (git rm --cached), never from disk.`);
}

// --- entry point ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (args.includes('init')) {
  init();
  process.exit(0);
}

if (args.includes('--list')) {
  listFragments();
  process.exit(0);
}

const newContent = build();

if (dryRun) {
  const oldContent = fs.existsSync(ROOT_GITIGNORE)
    ? fs.readFileSync(ROOT_GITIGNORE, 'utf-8')
    : '';

  const { removed, added } = diffLines(oldContent, newContent);

  console.log('[dry-run] Preview of changes to .gitignore:\n');

  if (removed.length === 0 && added.length === 0) {
    console.log('No changes.');
  } else {
    removed.forEach(l => console.log(`${RED}- ${l}${RESET}`));
    added.forEach(l => console.log(`${GREEN}+ ${l}${RESET}`));
  }

  console.log('\n[dry-run] .gitignore was NOT modified.');
} else {
  fs.writeFileSync(ROOT_GITIGNORE, newContent);
  console.log('.gitignore updated.');
}

try {
  cleanupTracked(dryRun);
} catch (e) {
  console.log('No tracked files matched ignore rules.');
}