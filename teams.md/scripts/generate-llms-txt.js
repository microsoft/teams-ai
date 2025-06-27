#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { collectFiles, getHierarchicalFiles } = require('./lib/file-collector');
const { processContent, extractSummary } = require('./lib/content-processor');

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
        const baseUrlMatch = configContent.match(/baseUrl\s*=\s*['"]([^'"]+)['"]/) || 
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
    const outputDir = path.join(baseDir, 'static');
    
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
    const mainFiles = collectFiles(path.join(baseDir, 'docs', 'main'));
    const langFiles = collectFiles(path.join(baseDir, 'docs', language));
    
    // Process all files to get metadata
    const processedFiles = await processAllFiles([...mainFiles, ...langFiles], baseDir);
    
    // Generate individual TXT files for each doc
    await generateIndividualTxtFiles(processedFiles, outputDir, language);
    
    // Process content for small version (navigation index)
    const smallContent = await generateSmallVersionHierarchical(language, baseDir, config);
    
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
 * @returns {Promise<Array>} Array of processed file objects
 */
async function processAllFiles(allFiles, baseDir) {
    const processedFiles = [];
    
    for (const file of allFiles) {
        const processed = await processContent(file, baseDir, true);
        if (processed.title || processed.content) {
            processedFiles.push(processed);
        }
    }
    
    // Sort by sidebar position, then by title
    return processedFiles.sort((a, b) => {
        const posA = a.sidebarPosition || 999;
        const posB = b.sidebarPosition || 999;
        
        if (posA !== posB) {
            return posA - posB;
        }
        
        return (a.title || '').localeCompare(b.title || '');
    });
}

/**
 * Generates individual .txt files for each documentation file
 * @param {Array} processedFiles - Array of processed file objects
 * @param {string} outputDir - Output directory path
 * @param {string} language - Language identifier
 */
async function generateIndividualTxtFiles(processedFiles, outputDir, language) {
    const docsDir = path.join(outputDir, `docs_${language}`);
    
    // Create docs directory
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }
    
    for (const file of processedFiles) {
        if (!file.content) continue;
        
        // Generate safe filename from title or path
        const fileName = generateSafeFileName(file.title || file.filePath);
        const outputPath = path.join(docsDir, `${fileName}.txt`);
        
        // Create plain text content with metadata header
        let txtContent = `# ${file.title}\n\n`;
        if (file.frontmatter.sidebar_position) {
            txtContent += `Sidebar Position: ${file.frontmatter.sidebar_position}\n`;
        }
        txtContent += `Source File: ${path.basename(file.filePath)}\n\n`;
        txtContent += '---\n\n';
        txtContent += file.content;
        
        fs.writeFileSync(outputPath, txtContent, 'utf8');
    }
}

/**
 * Generates the small version of llms.txt (navigation index)
 * @param {string} language - Language identifier
 * @param {Array} processedFiles - Array of processed file objects
 * @param {string} baseDir - Base directory path
 * @param {Object} config - Docusaurus config object
 * @returns {string} Generated navigation content
 */
async function generateSmallVersionHierarchical(language, baseDir, config) {
    const langName = language === 'typescript' ? 'TypeScript' : 'C#';
    // Remove trailing slash from URL and ensure baseUrl starts with slash
    const cleanUrl = config.url.replace(/\/$/, '');
    const cleanBaseUrl = config.baseUrl.startsWith('/') ? config.baseUrl : '/' + config.baseUrl;
    const fullBaseUrl = `${cleanUrl}${cleanBaseUrl}`;
    
    let content = `# Teams AI Library - ${langName} Documentation\n\n`;
    content += `> Microsoft Teams AI Library (v2) - A comprehensive framework for building AI-powered Teams applications using ${langName}.\n\n`;
    
    // Get hierarchical structure
    const hierarchical = getHierarchicalFiles(baseDir, language);
    
    // Add Main Documentation
    content += `## Main Documentation\n\n`;
    content += renderHierarchicalStructure(hierarchical.main, fullBaseUrl, language, 0);
    
    // Add Language-specific Documentation
    content += `## ${langName} Specific Documentation\n\n`;
    content += renderHierarchicalStructure(hierarchical.language, fullBaseUrl, language, 1);
    
    return content;
}

/**
 * Renders hierarchical structure with proper indentation
 * @param {Object} structure - Hierarchical structure object
 * @param {string} baseUrl - Base URL for links
 * @param {string} language - Language identifier
 * @param {number} baseIndent - Base indentation level (0 for main, 1 for language-specific)
 * @returns {string} Rendered content with proper hierarchy
 */
function renderHierarchicalStructure(structure, baseUrl, language, baseIndent = 0) {
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
        const indent = '  '.repeat(baseIndent);
        const fileIndent = '  '.repeat(baseIndent + 1);
        
        // Check if this folder has any content (files or children)
        const hasFiles = folder.files && folder.files.length > 0;
        const hasChildren = folder.children && Object.keys(folder.children).length > 0;
        const hasContent = hasFiles || hasChildren;
        
        if (hasContent) {
            // Add folder header with proper title
            const displayTitle = folder.title && folder.title !== folder.key ? folder.title : formatFolderName(folder.key);
            content += `${indent}### ${displayTitle}\n\n`;
            
            // Add files in this folder (sorted by order)
            if (hasFiles) {
                const sortedFiles = [...folder.files].sort((a, b) => {
                    const orderA = a.order || 999;
                    const orderB = b.order || 999;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.name.localeCompare(b.name);
                });
                
                for (const file of sortedFiles) {
                    const fileName = generateSafeFileName(file.title || file.name);
                    const summary = extractSummaryFromFile(file.path);
                    
                    content += `${fileIndent}- [${file.title}](${baseUrl}docs_${language}/${fileName}.txt)`;
                    if (summary) {
                        content += `: ${summary}`;
                    }
                    content += '\n';
                }
                
                // Add extra spacing after files if there are children
                if (hasChildren) {
                    content += '\n';
                }
            }
            
            // Recursively render children with increased indentation
            if (hasChildren) {
                content += renderHierarchicalStructure(folder.children, baseUrl, language, baseIndent + 1);
            }
            
            content += '\n';
        }
    }
    
    // Helper function for folder name formatting
    function formatFolderName(name) {
        return name
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
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
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Remove frontmatter
        const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
        
        // Extract first meaningful paragraph
        const paragraphs = withoutFrontmatter.split('\n\n');
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
    content += `> Complete documentation for Microsoft Teams AI Library (v2) - A comprehensive framework for building AI-powered Teams applications using ${langName}.\n\n`;
    
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
        migrations: []
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
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
        .substring(0, 50) // Limit length
        || 'untitled';
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
        migrations: 'Migrations'
    };
    
    return nameMap[sectionName] || sectionName
        .replace(/([A-Z])/g, ' $1') // Add spaces before capitals
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
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