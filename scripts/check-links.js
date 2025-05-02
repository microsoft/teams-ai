#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Path to the book directory (default or from command line)
const bookPath = process.argv[2] || path.join(__dirname, '..', 'book', 'src');
// Path for the results file
const resultsPath = path.join(__dirname, '..', 'link-check-results.txt');

// Buffer to collect output
let output = '';

function log(message) {
  console.log(message);
  output += message + '\n';
}

// Regex to match markdown links [text](url)
const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

async function getAllMarkdownFiles(dir) {
  const items = await readdir(dir);
  const files = await Promise.all(
    items.map(async (item) => {
      const fullPath = path.join(dir, item);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        return getAllMarkdownFiles(fullPath);
      } else if (item.endsWith('.md')) {
        return [fullPath];
      }
      return [];
    })
  );

  return files.flat();
}

function extractLinks(content) {
  const links = [];
  let match;

  while ((match = LINK_REGEX.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      isExternal:
        match[2].startsWith('http://') ||
        match[2].startsWith('https://') ||
        match[2].startsWith('mailto:'),
    });
  }

  return links;
}

async function fileExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (err) {
    return false;
  }
}

async function isDirectory(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
}

async function verifyInternalLink(baseDir, filePath, link) {
  if (link.isExternal) return { valid: true, link };

  let targetPath;
  const fileDir = path.dirname(filePath);

  // Handle anchors in links
  const urlParts = link.url.split('#');
  const linkPath = urlParts[0];

  if (!linkPath) {
    // Link is just an anchor to the current file
    return { valid: true, link };
  }

  // Resolve relative links
  targetPath = path.resolve(fileDir, decodeURIComponent(linkPath));

  // Check if the link is a directory
  const isDir = await isDirectory(targetPath);
  if (isDir) {
    // Rule 1: If it's a directory, check for README.md
    const readmePath = path.join(targetPath, 'README.md');
    const readmeExists = await fileExists(readmePath);

    return {
      valid: readmeExists,
      link,
      resolvedPath: targetPath,
      issue: readmeExists ? null : 'Directory missing README.md',
    };
  }

  // Check if the file exists as is without adding extension
  let exists = await fileExists(targetPath);

  // If the file doesn't exist and has no extension, check if it exists with .md
  if (!exists && !path.extname(targetPath)) {
    const mdPath = `${targetPath}.md`;
    const mdExists = await fileExists(mdPath);

    if (mdExists) {
      targetPath = mdPath;
      exists = true;
    }
  }

  // Check if the link exists
  if (!exists) {
    return {
      valid: false,
      link,
      resolvedPath: targetPath,
      issue: 'File does not exist',
    };
  }

  // Rule 2: Links should not be directly to README.md (except for SUMMARY.md)
  const fileName = path.basename(targetPath);
  const sourceFileName = path.basename(filePath);
  if (fileName === 'README.md' && sourceFileName !== 'SUMMARY.md') {
    return {
      valid: false,
      link,
      resolvedPath: targetPath,
      issue: 'Links should not be directly to README.md files (except from SUMMARY.md)',
    };
  }

  return {
    valid: true,
    link,
    resolvedPath: targetPath,
  };
}

async function main() {
  if (!bookPath) {
    console.error('Please provide a directory to scan');
    process.exit(1);
  }

  log(`Scanning markdown files in ${bookPath}...`);

  const files = await getAllMarkdownFiles(bookPath);
  log(`Found ${files.length} markdown files`);

  const brokenLinks = [];
  const externalLinks = [];

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const links = extractLinks(content);

    if (links.length === 0) continue;

    log(`\nFile: ${file}`);
    log(`Found ${links.length} links`);

    for (const link of links) {
      if (link.isExternal) {
        externalLinks.push({ file, ...link });
        log(`  [External] ${link.url}`);
      } else {
        const result = await verifyInternalLink(bookPath, file, link);
        if (!result.valid) {
          brokenLinks.push({
            file,
            ...link,
            resolvedPath: result.resolvedPath,
            issue: result.issue || 'File does not exist',
          });
          log(
            `  [BROKEN] ${link.url} -> ${result.resolvedPath}${result.issue ? ` (${result.issue})` : ''}`
          );
        } else {
          log(`  [OK] ${link.url}`);
        }
      }
    }
  }

  log(`\n\n=== SUMMARY ===`);
  log(`Found ${externalLinks.length} external links`);

  if (brokenLinks.length > 0) {
    log(`\nFound ${brokenLinks.length} broken internal links:`);
    brokenLinks.forEach((link) => {
      log(
        `- In file "${link.file}": [${link.text}](${link.url}) -> ${link.resolvedPath} (${link.issue})`
      );
    });

    // Save the output
    await writeFile(resultsPath, output);
    console.error('❌ Link validation found broken links. Check the results file for details.');
    process.exit(1);
  } else {
    log(`All internal links are valid!`);

    // Save the output
    await writeFile(resultsPath, output);
    console.log('✅ All links are valid!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
