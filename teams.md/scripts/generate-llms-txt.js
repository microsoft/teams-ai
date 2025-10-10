#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { collectFiles, getHierarchicalFiles } = require('./lib/file-collector');
const { processContent } = require('./lib/content-processor');
const FrontmatterParser = require('./lib/frontmatter-parser');

const COMMON_OVERALL_SUMMARY = (langName, language) => {
    const languageSpecificTips = {
        typescript: [
            "Use `npm run build` to check if the app builds and has no type errors."
        ],
        python: [
            "Use `uv run typecheck` to ensure that the app has no type errors."
        ],
        csharp: [
            "It's a good idea to build the application and fix compile time errors to help ensure the app works as expected."
        ]
    };

    const tips = languageSpecificTips[language] || [];
    const formattedTips = tips.map(tip => `- IMPORTANT: ${tip}`).join('\n');

    return `> Microsoft Teams AI Library (v2) - A comprehensive framework for building AI-powered Teams applications using ${langName}. Using this Library, you can easily build and integrate a variety of features in Microsoft Teams by building Agents or Tools. The documentation here helps by giving background information and code samples on how best to do this.

Things to remember:
- IMPORTANT: This Library is NOT based off of BotFramework (which the _previous_ version of the Teams AI Library was based on). This Library is a completely new framework.
- When scaffolding new applications, using the CLI is a lot simpler and preferred than doing it all by yourself.
${formattedTips}`;
};

/**
 * Reads Docusaurus config to get base URL
 * @param {string} baseDir - Base directory path
 * @returns {Object} Config object with url and baseUrl
 */
function getDocusaurusConfig(baseDir) {
    try {
        // Read the docusaurus.config.ts file
        const configPath = path.join(baseDir, 'docusaurus.config.ts');
        const configContent = fs.readFileSync(configPath, 'utf8');

        // Extract URL and baseUrl using regex (simple approach)
        const urlMatch = configContent.match(/url:\s*['"]([^'"]+)['"]/);
        const baseUrlMatch =
            configContent.match(/baseUrl\s*=\s*['"]([^'"]+)['"]/) ||
            configContent.match(/baseUrl:\s*['"]([^'"]+)['"]/);

        const url = urlMatch ? urlMatch[1] : 'https://microsoft.github.io';
        const baseUrl = baseUrlMatch ? baseUrlMatch[1] : '/teams-ai/';

        return { url, baseUrl };
    } catch (error) {
        console.warn('⚠️ Could not read Docusaurus config, using defaults');
        return { url: 'https://microsoft.github.io', baseUrl: '/teams-ai/' };
    }
}

/**
 * Generates llms.txt files for Teams AI documentation
 * Creates both small and full versions for TypeScript and C# docs
 */
async function generateLlmsTxt() {
    console.log('🚀 Starting llms.txt generation...');

    const baseDir = path.join(__dirname, '..');
    const outputDir = path.join(baseDir, 'static', 'llms_docs');

    // Get Docusaurus configuration
    const config = getDocusaurusConfig(baseDir);
    const cleanUrl = config.url.replace(/\/$/, '');
    const cleanBaseUrl = config.baseUrl.startsWith('/') ? config.baseUrl : '/' + config.baseUrl;
    console.log(`📍 Using base URL: ${cleanUrl}${cleanBaseUrl}`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        // Generate TypeScript version (main + typescript)
        console.log('📝 Generating TypeScript llms.txt files...');
        await generateLanguageFiles('typescript', baseDir, outputDir, config);

        // Generate C# version (main + csharp)
        console.log('📝 Generating C# llms.txt files...');
        await generateLanguageFiles('csharp', baseDir, outputDir, config);

        // Generate Python version (main + csharp)
        console.log('📝 Generating Python llms.txt files...');
        await generateLanguageFiles('python', baseDir, outputDir, config);

        console.log('✅ Successfully generated all llms.txt files!');
    } catch (error) {
        console.error('❌ Error generating llms.txt files:', error);
        process.exit(1);
    }
}

/**
 * Generates llms.txt files for a specific language
 * @param {string} language - 'typescript' or 'csharp'
 * @param {string} baseDir - Base directory path
 * @param {string} outputDir - Output directory path
 * @param {Object} config - Docusaurus config object
 */
async function generateLanguageFiles(language, baseDir, outputDir, config) {
    // Collect all relevant files
    // const mainFiles = collectFiles(path.join(baseDir, 'docs', 'main'));
    const mainFiles = []
    const langFiles = collectFiles(path.join(baseDir, 'docs', language));

    // Process all files to get metadata and file mapping
    const { processedFiles, fileMapping } = await processAllFiles(
        [...mainFiles, ...langFiles],
        baseDir
    );

    // Generate individual TXT files for each doc
    await generateIndividualTxtFiles(
        processedFiles,
        outputDir,
        language,
        baseDir,
        config,
        fileMapping
    );

    // Process content for small version (navigation index)
    const smallContent = await generateSmallVersionHierarchical(
        language,
        baseDir,
        config,
        fileMapping
    );

    // Process content for full version (all documentation)
    const fullContent = await generateFullVersion(language, processedFiles, baseDir);

    // Write main llms.txt files
    const smallPath = path.join(outputDir, `llms_${language}.txt`);
    const fullPath = path.join(outputDir, `llms_${language}_full.txt`);

    fs.writeFileSync(smallPath, smallContent, 'utf8');
    fs.writeFileSync(fullPath, fullContent, 'utf8');

    console.log(`  ✓ Generated ${path.basename(smallPath)} (${formatBytes(smallContent.length)})`);
    console.log(`  ✓ Generated ${path.basename(fullPath)} (${formatBytes(fullContent.length)})`);
    console.log(`  ✓ Generated ${processedFiles.length} individual .txt files`);
}

/**
 * Processes all files and returns structured data
 * @param {Array<string>} allFiles - All file paths to process
 * @param {string} baseDir - Base directory path
 * @returns {Promise<Object>} Object with processedFiles array and fileMapping Map
 */
async function processAllFiles(allFiles, baseDir) {
    const processedFiles = [];

    // First pass: build file mapping
    const fileMapping = new Map();
    for (const file of allFiles) {
        // Generate the same filename logic as used in generateIndividualTxtFiles
        const tempProcessed = await processContent(file, baseDir, false); // Quick pass for title
        if (tempProcessed) {
            // Only process files that aren't marked to ignore
            let fileName;
            if (path.basename(file) === 'README.md') {
                const parentDir = path.basename(path.dirname(file));
                fileName = generateSafeFileName(parentDir);
            } else {
                fileName = generateSafeFileName(tempProcessed.title || file);
            }
            fileMapping.set(file, fileName);
        }
    }

    // Second pass: process files with mapping for link resolution
    for (const file of allFiles) {
        const processed = await processContent(file, baseDir, true, fileMapping);
        if (processed && (processed.title || processed.content)) {
            processedFiles.push(processed);
        }
    }

    // Sort by sidebar position, then by title
    const sortedFiles = processedFiles.sort((a, b) => {
        const posA = a.sidebarPosition || 999;
        const posB = b.sidebarPosition || 999;

        if (posA !== posB) {
            return posA - posB;
        }

        return (a.title || '').localeCompare(b.title || '');
    });

    return { processedFiles: sortedFiles, fileMapping };
}

/**
 * Generates individual .txt files for each documentation file
 * @param {Array} processedFiles - Array of processed file objects
 * @param {string} outputDir - Output directory path
 * @param {string} language - Language identifier
 * @param {string} baseDir - Base directory path
 * @param {Object} config - Docusaurus config object
 * @param {Map} fileMapping - File mapping for link resolution
 */
async function generateIndividualTxtFiles(
    processedFiles,
    outputDir,
    language,
    baseDir,
    config,
    fileMapping
) {
    const docsDir = path.join(outputDir, `docs_${language}`);

    // Create docs directory
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    for (const file of processedFiles) {
        if (!file.content) continue;

        // Re-process the file with full URL generation for individual files
        const reprocessed = await processContent(
            file.filePath,
            baseDir,
            true,
            fileMapping,
            config,
            language
        );

        // Generate safe filename - use folder name for README.md files
        let fileName;
        if (path.basename(file.filePath) === 'README.md') {
            // Use parent folder name for README files
            const parentDir = path.basename(path.dirname(file.filePath));
            fileName = generateSafeFileName(parentDir);
        } else {
            fileName = generateSafeFileName(file.title || file.filePath);
        }

        const outputPath = path.join(docsDir, `${fileName}.txt`);

        // Use the reprocessed content directly without adding metadata header
        let txtContent = reprocessed.content || file.content; // Use reprocessed content with full URLs

        fs.writeFileSync(outputPath, txtContent, 'utf8');
    }
}

/**
 * Generates the small version of llms.txt (navigation index)
 * @param {string} language - Language identifier
 * @param {string} baseDir - Base directory path
 * @param {Object} config - Docusaurus config object
 * @param {Map} fileMapping - Mapping of source files to generated filenames
 * @returns {string} Generated navigation content
 */
async function generateSmallVersionHierarchical(language, baseDir, config, fileMapping) {
    const langName = language === 'typescript' ? 'TypeScript' : language === 'python' ? "Python" : 'C#';
    // Remove trailing slash from URL and ensure baseUrl starts with slash
    const cleanUrl = config.url.replace(/\/$/, '');
    const cleanBaseUrl = config.baseUrl.startsWith('/') ? config.baseUrl : '/' + config.baseUrl;
    const fullBaseUrl = `${cleanUrl}${cleanBaseUrl}`;

    let content = `# Teams AI Library - ${langName} Documentation\n\n`;
    content += COMMON_OVERALL_SUMMARY(langName, language) + '\n\n';

    // Get hierarchical structure
    const hierarchical = getHierarchicalFiles(baseDir, language);

    // Add Main Documentation
    // content += `## Main Documentation\n\n`;
    // content += renderHierarchicalStructure(hierarchical.main, fullBaseUrl, language, fileMapping, 3);

    // Add Language-specific Documentation
    // content += `## ${langName} Specific Documentation\n\n`;
    content += renderHierarchicalStructure(hierarchical.language, fullBaseUrl, language, fileMapping, 0);

    return content;
}

/**
 * Renders hierarchical structure with proper indentation
 * @param {Object} structure - Hierarchical structure object
 * @param {string} baseUrl - Base URL for links
 * @param {string} language - Language identifier
 * @param {Map} fileMapping - Mapping of source files to generated filenames
 * @param {number} indentLevel - Current indentation level (0 = section headers, 1+ = bullet points)
 * @returns {string} Rendered content with proper hierarchy
 */
function renderHierarchicalStructure(structure, baseUrl, language, fileMapping, indentLevel = 0) {
    let content = '';

    // Convert structure to sorted array
    const folders = Object.entries(structure)
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => {
            const orderA = a.order || 999;
            const orderB = b.order || 999;
            if (orderA !== orderB) return orderA - orderB;
            return a.key.localeCompare(b.key);
        });

    for (const folder of folders) {
        // Check if this folder has any content (files or children)
        const hasFiles = folder.files && folder.files.length > 0;
        const hasChildren = folder.children && Object.keys(folder.children).length > 0;
        const hasContent = hasFiles || hasChildren;

        if (hasContent) {
            // Check if this folder has a README file to make the header clickable
            const readmeFile = hasFiles
                ? folder.files.find((f) => path.basename(f.path) === 'README.md')
                : null;
            const displayTitle =
                folder.title && folder.title !== folder.key ? folder.title : formatFolderName(folder.key);

            // Generate indent for nested folders (use spaces, 2 per level)
            const indent = '  '.repeat(indentLevel);

            if (readmeFile) {
                // Make folder header clickable by linking to the README
                let folderFileName;
                if (fileMapping && fileMapping.has(readmeFile.path)) {
                    folderFileName = fileMapping.get(readmeFile.path);
                } else {
                    folderFileName = generateSafeFileName(folder.key);
                }

                // Use ### header for top-level sections (indentLevel 0), bullet points for nested
                if (indentLevel === 0) {
                    content += `### [${displayTitle}](${baseUrl}llms_docs/docs_${language}/${folderFileName}.txt)\n\n`;
                } else {
                    content += `${indent}- [${displayTitle}](${baseUrl}llms_docs/docs_${language}/${folderFileName}.txt)`;
                }

                // Add summary from README if available
                try {
                    const readmeContent = fs.readFileSync(readmeFile.path, 'utf8');
                    const summary = FrontmatterParser.getProperty(readmeContent, 'summary');
                    if (summary) {
                        if (indentLevel === 0) {
                            content += `${summary}\n\n`;
                        } else {
                            content += `: ${summary}`;
                        }
                    }
                } catch (error) {
                    // Ignore errors reading README summary
                }

                if (indentLevel > 0) {
                    content += '\n';
                }
            } else {
                // No README
                if (indentLevel === 0) {
                    content += `### ${displayTitle}\n\n`;
                } else {
                    content += `${indent}- ${displayTitle}\n`;
                }
            }

            // Add files in this folder (sorted by order), excluding README
            if (hasFiles) {
                const sortedFiles = [...folder.files]
                    .filter((f) => path.basename(f.path) !== 'README.md') // Exclude README since it's now the header link
                    .sort((a, b) => {
                        const orderA = a.order || 999;
                        const orderB = b.order || 999;
                        if (orderA !== orderB) return orderA - orderB;
                        return a.name.localeCompare(b.name);
                    });

                for (const file of sortedFiles) {
                    // Use file mapping to get the correct generated filename
                    let fileName;
                    if (fileMapping && fileMapping.has(file.path)) {
                        fileName = fileMapping.get(file.path);
                    } else {
                        fileName = generateSafeFileName(file.title || file.name);
                    }

                    const summary = extractSummaryFromFile(file.path);

                    // Files are always indented one level deeper than their parent folder
                    const fileIndent = '  '.repeat(indentLevel + 1);
                    content += `${fileIndent}- [${file.title}](${baseUrl}llms_docs/docs_${language}/${fileName}.txt)`;
                    if (summary) {
                        content += `: ${summary}`;
                    }
                    content += '\n';
                }
            }

            // Recursively render children with increased indent
            if (hasChildren) {
                content += renderHierarchicalStructure(folder.children, baseUrl, language, fileMapping, indentLevel + 1);
            }

            // Add spacing after top-level sections
            if (indentLevel === 0) {
                content += '\n';
            }
        }
    }

    // Helper function for folder name formatting
    function formatFolderName(name) {
        return name.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }

    return content;
}

/**
 * Extracts summary from a file (cached approach)
 * @param {string} filePath - Path to the file
 * @returns {string} File summary or empty string
 */
function extractSummaryFromFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // First check for summary in frontmatter
        const summary = FrontmatterParser.getProperty(fileContent, 'summary');
        if (summary) {
            return summary;
        }

        // Fallback to extracting first meaningful paragraph if no summary in frontmatter
        const { content } = FrontmatterParser.extract(fileContent);
        const paragraphs = content.split('\n\n');
        for (const paragraph of paragraphs) {
            const clean = paragraph
                .replace(/#+\s*/g, '') // Remove headers
                .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
                .replace(/\*(.+?)\*/g, '$1') // Remove italic
                .replace(/`(.+?)`/g, '$1') // Remove inline code
                .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
                .trim();

            if (clean.length > 20 && !clean.startsWith('```') && !clean.startsWith('import')) {
                return clean.length > 100 ? clean.substring(0, 100) + '...' : clean;
            }
        }
    } catch (error) {
        // Ignore file read errors
    }

    return '';
}

/**
 * Generates the full version of llms.txt (complete documentation)
 * @param {string} language - Language identifier
 * @param {Array} processedFiles - Array of processed file objects
 * @param {string} baseDir - Base directory path
 * @returns {string} Generated content
 */
async function generateFullVersion(language, processedFiles, baseDir) {
    const langName = language === 'typescript' ? 'TypeScript' : 'C#';

    let content = `# Teams AI Library - ${langName} Documentation (Complete)\n\n`;
    content += COMMON_OVERALL_SUMMARY(langName, language) + '\n\n';

    // Group files by section
    const sections = groupFilesBySection(processedFiles, baseDir);

    // Process all sections
    for (const [sectionName, files] of Object.entries(sections)) {
        if (!files || files.length === 0) continue;

        content += `## ${formatSectionName(sectionName)}\n\n`;

        for (const file of files) {
            if (file.content) {
                content += `### ${file.title}\n\n${file.content}\n\n---\n\n`;
            }
        }
    }

    return content;
}

/**
 * Groups files by their section based on file path
 * @param {Array} processedFiles - Array of processed file objects
 * @param {string} baseDir - Base directory path
 * @returns {Object} Grouped files by section
 */
function groupFilesBySection(processedFiles, baseDir) {
    const sections = {
        main: [],
        gettingStarted: [],
        essentials: [],
        inDepthGuides: [],
        migrations: [],
    };

    for (const file of processedFiles) {
        const relativePath = path.relative(path.join(baseDir, 'docs'), file.filePath);

        if (relativePath.startsWith('main/')) {
            sections.main.push(file);
        } else if (relativePath.includes('getting-started/')) {
            sections.gettingStarted.push(file);
        } else if (relativePath.includes('essentials/')) {
            sections.essentials.push(file);
        } else if (relativePath.includes('in-depth-guides/')) {
            sections.inDepthGuides.push(file);
        } else if (relativePath.includes('migrations/')) {
            sections.migrations.push(file);
        } else {
            // Create dynamic section based on directory
            const parts = relativePath.split('/');
            if (parts.length > 1) {
                const sectionKey = parts[1].replace(/[^a-zA-Z0-9]/g, '');
                if (!sections[sectionKey]) {
                    sections[sectionKey] = [];
                }
                sections[sectionKey].push(file);
            }
        }
    }

    // Sort files within each section by sidebar position
    for (const sectionFiles of Object.values(sections)) {
        sectionFiles.sort((a, b) => {
            const posA = a.sidebarPosition || 999;
            const posB = b.sidebarPosition || 999;

            if (posA !== posB) {
                return posA - posB;
            }

            return (a.title || '').localeCompare(b.title || '');
        });
    }

    return sections;
}

/**
 * Generates a safe filename from a title
 * @param {string} title - Title to convert to filename
 * @returns {string} Safe filename
 */
function generateSafeFileName(title) {
    return (
        title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
            .substring(0, 50) || // Limit length
        'untitled'
    );
}

/**
 * Formats a section name for display
 * @param {string} sectionName - Section name to format
 * @returns {string} Formatted section name
 */
function formatSectionName(sectionName) {
    const nameMap = {
        main: 'Main Documentation',
        gettingStarted: 'Getting Started',
        essentials: 'Essentials',
        inDepthGuides: 'In-Depth Guides',
        migrations: 'Migrations',
    };

    return (
        nameMap[sectionName] ||
        sectionName
            .replace(/([A-Z])/g, ' $1') // Add spaces before capitals
            .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
            .trim()
    );
}

/**
 * Formats bytes into human-readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Run the generator if this file is executed directly
if (require.main === module) {
    generateLlmsTxt();
}

module.exports = { generateLlmsTxt };
