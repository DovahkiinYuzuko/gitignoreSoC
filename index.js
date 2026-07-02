#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const GITIGNORES_DIR = path.join(ROOT, '.gitignores');
const ROOT_GITIGNORE = path.join(ROOT, '.gitignore');
const MARKER = '# ---AUTO-Generated---';

function build() {
  const projectName = path.basename(ROOT);
  const base = fs.readFileSync(ROOT_GITIGNORE, 'utf-8').split(MARKER)[0].trimEnd();

  // 既存の "# project:" 行があれば消して、新しいのを先頭につける
  const baseWithoutProjectLine = base
    .split('\n')
    .filter(line => !line.startsWith('# project:'))
    .join('\n')
    .trimStart();

  const files = fs.readdirSync(GITIGNORES_DIR).filter(f => f.endsWith('.gitignore'));

  const generated = files.map(f => {
    const tag = path.basename(f, '.gitignore');
    const content = fs.readFileSync(path.join(GITIGNORES_DIR, f), 'utf-8').trimEnd();
    return `# ${tag}\n${content}`;
  }).join('\n');

  return `# project:${projectName}\n${baseWithoutProjectLine}\n${MARKER}\n${generated}\n`;
}

function cleanupTracked(dryRun) {
  const tracked = execSync('git ls-files', { cwd: ROOT }).toString().split('\n').filter(Boolean);
  if (tracked.length === 0) return;

  const result = execSync('git check-ignore --stdin --verbose', {
    cwd: ROOT,
    input: tracked.join('\n'),
  }).toString();
  // check-ignore は非ゼロ終了だと例外投げるので try-catch 必要(該当なしの場合)

  const toRemove = result.split('\n').filter(Boolean).map(line => line.split('\t').pop());
  if (toRemove.length === 0) return;

  if (dryRun) {
    console.log('[dry-run] would git rm --cached:', toRemove);
  } else {
    execSync(`git rm --cached ${toRemove.map(f => `"${f}"`).join(' ')}`, { cwd: ROOT });
  }
}

const dryRun = process.argv.includes('--dry-run');
const newContent = build();
fs.writeFileSync(ROOT_GITIGNORE, newContent);
console.log(dryRun ? '[dry-run] .gitignore updated (preview)' : '.gitignore updated');

try {
  cleanupTracked(dryRun);
} catch (e) {
  // check-ignoreが1件もヒットしない場合、非ゼロ終了コードで例外になる
  console.log('No tracked files matched ignore rules.');
}