/**
 * mdbook-lang.js
 *
 * This script updates book.toml to include all _lang.*.md files in [output.html.copy-files].
 * mdBook will handle copying those files to the output folder during build/serve.
 */

const fs = require('fs');
const path = require('path');

// Define paths relative to project root
const projectRoot = path.join(__dirname, '..');
const srcRoot = path.join(projectRoot, 'book', 'src');
const bookTomlPath = path.join(projectRoot, 'book', 'book.toml');

let langFiles = [];

/**
 * Recursively finds all _lang.*.md files in _lang subfolders
 * @param {string} dir - Current directory to process
 */
function findLangFiles(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findLangFiles(fullPath);
    } else if (
      entry.isFile() &&
      entry.name.startsWith('_lang.') &&
      entry.name.endsWith('.md') &&
      path.basename(dir) === '_lang'
    ) {
      const relDir = path.relative(srcRoot, dir);
      const relSrc = path.join(relDir, entry.name).replace(/\\/g, '/');
      langFiles.push(relSrc);
    }
  });
}

// Find all language files
findLangFiles(srcRoot);

/**
 * Updates book.toml to include language files in the build
 * @param {string[]} langFiles - Array of relative paths to language files
 */
function updateBookToml(langFiles) {
  if (!fs.existsSync(bookTomlPath)) {
    console.error('❌ book.toml not found!');
    process.exit(1);
  }
  let toml = fs.readFileSync(bookTomlPath, 'utf8');

  // Remove any existing [output.html.copy-files] section
  toml = toml.replace(/\[output\.html\.copy-files\][^\[]*/g, '');

  // Build new section with unique language files
  let copyFilesSection = '[output.html.copy-files]\n';
  const uniqueLangFiles = Array.from(new Set(langFiles));
  uniqueLangFiles.forEach(relSrc => {
    const srcPath = relSrc.replace(/^\.?\/?/, '');
    copyFilesSection += `"src/${srcPath}" = "${srcPath}"\n`;
  });

  // Insert new section at end of file
  toml = toml.trim() + '\n\n' + copyFilesSection;
  fs.writeFileSync(bookTomlPath, toml, 'utf8');
  console.log('✅ Updated book.toml with [output.html.copy-files] section.');
}

// Update book.toml with language files
updateBookToml(langFiles);

console.log('✅ All _lang.*.md files registered in book.toml. Let mdBook handle copying during build/serve.');
