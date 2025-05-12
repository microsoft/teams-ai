#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { LANGUAGES } = require('./lang');

function createLangFiles(inputPath) {
    // Ensure path is relative to book/src
    const srcPath = path.join(process.cwd(), 'book/src');
    const fullPath = path.join(srcPath, inputPath);
    const dir = path.dirname(fullPath);
    const baseName = path.basename(inputPath, '.md');

    // Create _lang directory if it doesn't exist
    const langDir = path.join(dir, '_lang');
    if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
    }

    // Create language files
    Object.keys(LANGUAGES).forEach(lang => {
        const langFile = path.join(langDir, `_lang.${baseName}.${lang}.md`);
        if (!fs.existsSync(langFile)) {
            const content = `{{#lang name=section1}}
<!-- Add ${LANGUAGES[lang].name} content here -->
{{#lang}}
`;
            fs.writeFileSync(langFile, content);
            console.log(`Created ${langFile}`);
        } else {
            console.log(`${langFile} already exists`);
        }
    });

    // Update book.toml to include the new files
    const bookTomlPath = path.join(process.cwd(), 'book/book.toml');
    let bookToml = fs.readFileSync(bookTomlPath, 'utf8');

    // Find the [output.html.copy-files] section
    const copyFilesSection = '[output.html.copy-files]';
    if (!bookToml.includes(copyFilesSection)) {
        bookToml += `\n\n${copyFilesSection}\n`;
    }

    // Add the new files to copy
    Object.keys(LANGUAGES).forEach(lang => {
        const relPath = `src/${inputPath.replace(/\.md$/, '')}/_lang/_lang.${baseName}.${lang}.md`;
        const copyEntry = `"${relPath}" = "${relPath.replace('src/', '')}"`;

        if (!bookToml.includes(copyEntry)) {
            bookToml = bookToml.replace(
                copyFilesSection,
                `${copyFilesSection}\n"${relPath}" = "${relPath.replace('src/', '')}"`
            );
        }
    });

    fs.writeFileSync(bookTomlPath, bookToml);
    console.log('Updated book.toml with new language files');
}

function processPath(inputPath) {
    const srcPath = path.join(process.cwd(), 'book/src');
    const fullPath = path.join(srcPath, inputPath);

    if (!fs.existsSync(fullPath)) {
        console.error(`Path not found: ${inputPath}`);
        return;
    }

    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
        // Process all .md files in directory
        const files = fs.readdirSync(fullPath);
        files.forEach(file => {
            if (file.endsWith('.md') && !file.startsWith('_lang.')) {
                const relativePath = path.join(inputPath, file);
                createLangFiles(relativePath);
            }
        });
    } else if (stats.isFile() && inputPath.endsWith('.md')) {
        createLangFiles(inputPath);
    } else {
        console.error(`Invalid path: ${inputPath} (must be a directory or .md file)`);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: npm run docs:lang-file -- <path-to-markdown-file-or-directory> [additional-files...]');
    console.error('Examples:');
    console.error('  npm run docs:lang-file -- getting-started/code-basics.md');
    console.error('  npm run docs:lang-file -- getting-started/code-basics.md getting-started/running-in-teams.md');
    console.error('  npm run docs:lang-file -- getting-started');
    process.exit(1);
}

// Process each argument
args.forEach(processPath);