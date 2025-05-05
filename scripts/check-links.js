#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Path to the book directory and SUMMARY.md (default or from command line)
const summaryPath = process.argv[2] || path.join(__dirname, '..', 'book', 'src', 'SUMMARY.md');
const bookPath = path.dirname(summaryPath);
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

// Add a function to extract headers from markdown content
function extractHeaders(content) {
  // Regex to match only # style headers (from # to ######)
  const headerRegex = /^(#{1,6})\s+(.+?)(?:\s+\1)?$/gm;
  const headers = new Map();

  let match;
  while ((match = headerRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();

    // Convert header text to GitHub-style anchor
    const anchor =
      '#' +
      text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen

    headers.set(anchor, text);
  }

  return headers;
}

// Function to extract all markdown files linked from SUMMARY.md
async function getLinkedMarkdownFiles(summaryPath) {
  const content = await readFile(summaryPath, 'utf8');
  const links = extractLinks(content);
  const baseDir = path.dirname(summaryPath);

  // Filter out external links and extract file paths
  const markdownFiles = new Set();

  for (const link of links) {
    if (!link.isExternal && link.url.trim() !== '') {
      // Resolve path relative to SUMMARY.md location
      let filePath = path.resolve(baseDir, decodeURIComponent(link.url.split('#')[0]));

      // If it's a directory, assume README.md
      const isDir = await isDirectory(filePath);
      if (isDir) {
        filePath = path.join(filePath, 'README.md');
      }
      // If no extension, assume .md
      else if (!path.extname(filePath)) {
        filePath += '.md';
      }

      markdownFiles.add(filePath);
    }
  }

  // Add the summary file itself to the list
  markdownFiles.add(path.resolve(summaryPath));

  return Array.from(markdownFiles);
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
  const anchor = urlParts.length > 1 ? '#' + urlParts[1] : null;

  if (!linkPath) {
    // Link is just an anchor to the current file
    if (anchor) {
      // Check if the anchor exists in the current file
      const content = await readFile(filePath, 'utf8');
      const headers = extractHeaders(content);

      if (!headers.has(anchor)) {
        return {
          valid: false,
          link,
          resolvedPath: filePath,
          issue: `Header "${anchor}" not found in current file`,
        };
      }
    }
    return { valid: true, link };
  }

  // Resolve relative links
  targetPath = path.resolve(fileDir, decodeURIComponent(linkPath));

  // Check if the link is a directory
  const isDir = await isDirectory(targetPath);
  if (isDir) {
    // Rule 1: If it's a directory link, it should link directly to README.md instead
    const readmePath = path.join(targetPath, 'README.md');
    const readmeExists = await fileExists(readmePath);

    if (!readmeExists) {
      return {
        valid: false,
        link,
        resolvedPath: targetPath,
        issue: 'Directory missing README.md',
      };
    }

    // Links should be to README.md, not to the directory itself
    return {
      valid: false,
      link,
      resolvedPath: targetPath,
      issue: 'Links to directories should explicitly include README.md',
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

  // If there's an anchor, check if it exists in the target file
  if (anchor) {
    const content = await readFile(targetPath, 'utf8');
    const headers = extractHeaders(content);

    if (!headers.has(anchor)) {
      return {
        valid: false,
        link,
        resolvedPath: targetPath,
        issue: `Header "${anchor}" not found in target file`,
      };
    }
  }

  return {
    valid: true,
    link,
    resolvedPath: targetPath,
  };
}

async function main() {
  if (!fs.existsSync(summaryPath)) {
    console.error(`SUMMARY.md not found at ${summaryPath}`);
    process.exit(1);
  }

  log(`Using SUMMARY.md at ${summaryPath}`);

  // Get files linked in SUMMARY.md
  const files = await getLinkedMarkdownFiles(summaryPath);
  log(`Found ${files.length} markdown files referenced in SUMMARY.md`);

  const brokenLinks = [];
  const externalLinks = [];

  for (const file of files) {
    if (!(await fileExists(file))) {
      log(`\nWARNING: Referenced file does not exist: ${file}`);
      continue;
    }

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
