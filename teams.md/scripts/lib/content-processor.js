const fs = require('fs');
const path = require('path');

/**
 * Checks if a file should be ignored based on section-wide README filtering
 * @param {string} filePath - Path to the file to check
 * @returns {boolean} True if file should be ignored due to section filtering
 */
function shouldIgnoreFileBySection(filePath) {
    // Get the directory path
    let currentDir = path.dirname(filePath);
    
    // Walk up the directory tree looking for README.md files
    while (currentDir && currentDir !== path.dirname(currentDir)) {
        const readmePath = path.join(currentDir, 'README.md');
        
        if (fs.existsSync(readmePath)) {
            try {
                const readmeContent = fs.readFileSync(readmePath, 'utf8');
                const frontmatterMatch = readmeContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
                if (frontmatterMatch) {
                    const frontmatter = parseFrontmatter(frontmatterMatch[1]);
                    // If this README is marked to ignore, ignore the entire section
                    if (frontmatter.llms === 'ignore' || frontmatter.llms === false) {
                        return true;
                    }
                }
            } catch (error) {
                // Ignore errors reading README
            }
        }
        
        // Move up one directory
        currentDir = path.dirname(currentDir);
    }
    
    return false;
}

/**
 * Processes a markdown/MDX file and extracts its content
 * @param {string} filePath - Path to the file to process
 * @param {string} baseDir - Base directory for resolving relative paths
 * @param {boolean} includeCodeBlocks - Whether to include FileCodeBlock content
 * @param {Map} fileMapping - Optional mapping of source files to generated filenames
 * @param {Object} config - Optional Docusaurus config for full URL generation
 * @param {string} language - Optional language identifier for URL generation
 * @returns {Promise<Object>} Processed content with title, content, and metadata
 */
async function processContent(filePath, baseDir, includeCodeBlocks = false, fileMapping = null, config = null, language = null) {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found: ${filePath}`);
            return { title: '', content: '', frontmatter: {} };
        }

        const rawContent = fs.readFileSync(filePath, 'utf8');
        const { title, content, frontmatter } = await parseMarkdownContent(rawContent, baseDir, includeCodeBlocks, filePath, fileMapping, config, language);
        
        // Check if this file should be excluded from LLM output
        if (frontmatter.llms === 'ignore' || frontmatter.llms === false) {
            return null; // Return null to indicate this file should be skipped
        }
        
        // Check if this file should be ignored due to section-wide filtering
        if (shouldIgnoreFileBySection(filePath)) {
            return null; // Return null to indicate this file should be skipped
        }
        
        return {
            title: title || generateTitleFromPath(filePath),
            content: content || '',
            frontmatter: frontmatter || {},
            filePath,
            sidebarPosition: frontmatter.sidebar_position || 999,
            relativeUrl: generateRelativeUrl(filePath, baseDir)
        };
    } catch (error) {
        console.error(`❌ Error processing file ${filePath}:`, error.message);
        return { title: generateTitleFromPath(filePath), content: '', frontmatter: {}, filePath };
    }
}

/**
 * Parses markdown/MDX content and extracts title and content
 * @param {string} rawContent - Raw file content
 * @param {string} baseDir - Base directory for resolving paths
 * @param {boolean} includeCodeBlocks - Whether to process FileCodeBlocks
 * @param {string} filePath - Current file path for resolving relative links
 * @param {Map} fileMapping - Optional mapping of source files to generated filenames
 * @param {Object} config - Optional Docusaurus config for full URL generation
 * @param {string} language - Optional language identifier for URL generation
 * @returns {Promise<Object>} Parsed title, content, and frontmatter
 */
async function parseMarkdownContent(rawContent, baseDir, includeCodeBlocks, filePath, fileMapping, config, language) {
    let content = rawContent;
    let title = '';
    let frontmatter = {};
    
    // Extract and remove frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
    if (frontmatterMatch) {
        frontmatter = parseFrontmatter(frontmatterMatch[1]);
        title = frontmatter.title || frontmatter.sidebar_label || '';
        content = content.replace(frontmatterMatch[0], '');
    }
    
    // Extract title from first H1 if not found in frontmatter
    if (!title) {
        const h1Match = content.match(/^#\s+(.+)$/m);
        if (h1Match) {
            title = h1Match[1].trim();
        }
    }
    
    // Remove import statements
    content = content.replace(/^import\s+.*$/gm, '');
    
    // Process FileCodeBlock components if requested
    if (includeCodeBlocks) {
        content = await processFileCodeBlocks(content, baseDir);
    } else {
        // Remove FileCodeBlock components for small version
        content = content.replace(/<FileCodeBlock[\s\S]*?\/>/g, '[Code example removed for brevity]');
    }
    
    // Clean up MDX-specific syntax while preserving markdown
    content = cleanMdxSyntax(content);
    
    // Fix internal relative links
    content = fixInternalLinks(content, filePath, fileMapping, config, language);
    
    // Remove excessive whitespace
    content = content.replace(/\n{3,}/g, '\n\n').trim();
    
    return { title, content, frontmatter };
}

/**
 * Processes FileCodeBlock components and includes the referenced code
 * @param {string} content - Content containing FileCodeBlock components
 * @param {string} baseDir - Base directory for resolving paths
 * @returns {Promise<string>} Content with FileCodeBlocks replaced by actual code
 */
async function processFileCodeBlocks(content, baseDir) {
    const fileCodeBlockRegex = /<FileCodeBlock\s+([^>]+)\/>/g;
    let processedContent = content;
    let match;
    
    while ((match = fileCodeBlockRegex.exec(content)) !== null) {
        const attributes = parseAttributes(match[1]);
        const { src, lang } = attributes;
        
        if (src) {
            try {
                const codeContent = await loadCodeFile(src, baseDir);
                const codeBlock = `\`\`\`${lang || 'typescript'}\n${codeContent}\n\`\`\``;
                processedContent = processedContent.replace(match[0], codeBlock);
            } catch (error) {
                console.warn(`⚠️ Could not load code file ${src}:`, error.message);
                processedContent = processedContent.replace(match[0], `[Code file not found: ${src}]`);
            }
        }
    }
    
    return processedContent;
}

/**
 * Loads code content from a file referenced by FileCodeBlock
 * @param {string} src - Source path from FileCodeBlock (e.g., "/generated-snippets/ts/example.ts")
 * @param {string} baseDir - Base directory
 * @returns {Promise<string>} Code content
 */
async function loadCodeFile(src, baseDir) {
    // Convert src path to local file path
    let filePath;
    if (src.startsWith('/')) {
        filePath = path.join(baseDir, 'static', src.substring(1));
    } else {
        filePath = path.join(baseDir, 'static', src);
    }
    
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8').trim();
    } else {
        throw new Error(`File not found: ${filePath}`);
    }
}

/**
 * Parses attributes from JSX-style attribute string
 * @param {string} attributeString - String containing attributes
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attributeString) {
    const attributes = {};
    const regex = /(\w+)=["']([^"']+)["']/g;
    let match;
    
    while ((match = regex.exec(attributeString)) !== null) {
        attributes[match[1]] = match[2];
    }
    
    return attributes;
}

/**
 * Parses YAML frontmatter into an object
 * @param {string} frontmatterText - Raw frontmatter text
 * @returns {Object} Parsed frontmatter
 */
function parseFrontmatter(frontmatterText) {
    const frontmatter = {};
    const lines = frontmatterText.split('\n');
    
    for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
            const key = match[1];
            let value = match[2].trim();
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            // Parse boolean values
            if (value === 'true') {
                value = true;
            } else if (value === 'false') {
                value = false;
            }
            
            frontmatter[key] = value;
        }
    }
    
    return frontmatter;
}

/**
 * Cleans MDX-specific syntax while preserving standard markdown
 * @param {string} content - Content to clean
 * @returns {string} Cleaned content
 */
function cleanMdxSyntax(content) {
    let cleaned = content;
    
    // Remove JSX components (except code blocks which are handled separately)
    cleaned = cleaned.replace(/<\/?[A-Z][^>]*>/g, '');
    
    // Remove empty JSX fragments
    cleaned = cleaned.replace(/<>\s*<\/>/g, '');
    
    // Remove JSX expressions but keep the content if it's simple text
    cleaned = cleaned.replace(/\{([^{}]+)\}/g, (match, expr) => {
        // Keep simple text expressions, remove complex ones
        if (expr.includes('(') || expr.includes('.') || expr.includes('[')) {
            return '';
        }
        return expr;
    });
    
    // Clean up multiple empty lines
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return cleaned;
}

/**
 * Generates a title from file path
 * @param {string} filePath - File path
 * @returns {string} Generated title
 */
function generateTitleFromPath(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Convert README to parent directory name
    if (fileName.toLowerCase() === 'readme') {
        const parentDir = path.basename(path.dirname(filePath));
        return formatTitle(parentDir);
    }
    
    return formatTitle(fileName);
}

/**
 * Formats a string into a proper title
 * @param {string} str - String to format
 * @returns {string} Formatted title
 */
function formatTitle(str) {
    return str
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
}

/**
 * Generates a relative URL for a documentation file
 * @param {string} filePath - Full path to the file
 * @param {string} baseDir - Base directory path
 * @returns {string} Relative URL for the file
 */
function generateRelativeUrl(filePath, baseDir) {
    const relativePath = path.relative(path.join(baseDir, 'docs'), filePath);
    
    // Convert file path to URL format
    let url = relativePath
        .replace(/\\/g, '/') // Convert Windows paths
        .replace(/\.mdx?$/, '') // Remove .md/.mdx extension
        .replace(/\/README$/i, '') // Remove /README from end
        .replace(/\/index$/i, ''); // Remove /index from end
    
    // Add leading slash
    if (!url.startsWith('/')) {
        url = '/' + url;
    }
    
    // Handle empty URL (root README)
    if (url === '/') {
        url = '';
    }
    
    return url;
}

/**
 * Fixes internal relative links to point to generated .txt files
 * @param {string} content - Content containing markdown links
 * @param {string} currentFilePath - Path of the current file being processed
 * @param {Map} fileMapping - Optional mapping of source files to generated filenames
 * @param {Object} config - Optional Docusaurus config for full URL generation
 * @param {string} language - Optional language identifier for URL generation
 * @returns {string} Content with fixed links
 */
function fixInternalLinks(content, currentFilePath, fileMapping, config, language) {
    // Pattern to match markdown links: [text](link)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    return content.replace(linkRegex, (match, text, link) => {
        // Skip external links (http/https/mailto/etc)
        if (link.startsWith('http') || link.startsWith('mailto') || link.startsWith('#')) {
            return match;
        }
        
        // Skip absolute paths starting with /
        if (link.startsWith('/') && !link.startsWith('//')) {
            return match;
        }
        
        // Handle relative links
        if (!link.includes('://')) {
            // Remove any file extensions and anchors
            const cleanLink = link.split('#')[0].replace(/\.(md|mdx)$/, '');
            
            // If it's just a filename without path separators, it's likely a sibling file
            if (!cleanLink.includes('/')) {
                // Try to resolve using file mapping first
                if (fileMapping) {
                    const currentDir = path.dirname(currentFilePath);
                    const possiblePath = path.join(currentDir, cleanLink + '.md');
                    const possibleMdxPath = path.join(currentDir, cleanLink + '.mdx');
                    
                    // Look for the file in the mapping
                    for (const [sourcePath, generatedName] of fileMapping.entries()) {
                        // Check exact path match or basename match
                        if (sourcePath === possiblePath || 
                            sourcePath === possibleMdxPath ||
                            path.basename(sourcePath, '.md') === cleanLink ||
                            path.basename(sourcePath, '.mdx') === cleanLink) {
                            
                            // Generate full URL if config and language are provided
                            if (config && language) {
                                const cleanUrl = config.url.replace(/\/$/, '');
                                const cleanBaseUrl = config.baseUrl.startsWith('/') ? config.baseUrl : '/' + config.baseUrl;
                                const fullBaseUrl = `${cleanUrl}${cleanBaseUrl}`;
                                return `[${text}](${fullBaseUrl}llms_docs/docs_${language}/${generatedName}.txt)`;
                            } else {
                                return `[${text}](${generatedName}.txt)`;
                            }
                        }
                    }
                }
                
                // Fallback to simple conversion
                const safeFileName = cleanLink
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                    .substring(0, 50)
                    || 'untitled';
                
                // Generate full URL if config and language are provided
                if (config && language) {
                    const cleanUrl = config.url.replace(/\/$/, '');
                    const cleanBaseUrl = config.baseUrl.startsWith('/') ? config.baseUrl : '/' + config.baseUrl;
                    const fullBaseUrl = `${cleanUrl}${cleanBaseUrl}`;
                    return `[${text}](${fullBaseUrl}llms_docs/docs_${language}/${safeFileName}.txt)`;
                } else {
                    return `[${text}](${safeFileName}.txt)`;
                }
            }
        }
        
        // Return original link if we can't process it
        return match;
    });
}

/**
 * Extracts a summary from content (first paragraph or section)
 * @param {string} content - Content to summarize
 * @param {number} maxLength - Maximum length of summary
 * @returns {string} Content summary
 */
function extractSummary(content, maxLength = 200) {
    // Remove markdown formatting for summary
    let summary = content
        .replace(/#+\s*/g, '') // Remove headers
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.+?)\*/g, '$1') // Remove italic
        .replace(/`(.+?)`/g, '$1') // Remove inline code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
        .trim();
    
    // Get first paragraph
    const firstParagraph = summary.split('\n\n')[0];
    
    // Truncate if too long
    if (firstParagraph.length > maxLength) {
        return firstParagraph.substring(0, maxLength).trim() + '...';
    }
    
    return firstParagraph;
}

module.exports = {
    processContent,
    parseMarkdownContent,
    processFileCodeBlocks,
    loadCodeFile,
    extractSummary,
    generateTitleFromPath,
    formatTitle,
    generateRelativeUrl,
    fixInternalLinks,
    shouldIgnoreFileBySection
};