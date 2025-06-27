const fs = require('fs');
const path = require('path');

/**
 * Recursively collects all markdown and MDX files from a directory
 * @param {string} dirPath - Directory path to search
 * @param {Array<string>} extensions - File extensions to collect (default: ['.md', '.mdx'])
 * @returns {Array<string>} Array of file paths
 */
function collectFiles(dirPath, extensions = ['.md', '.mdx']) {
    const files = [];
    
    if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️ Directory not found: ${dirPath}`);
        return files;
    }
    
    /**
     * Recursively traverse directory
     * @param {string} currentPath - Current directory path
     */
    function traverse(currentPath) {
        const items = fs.readdirSync(currentPath, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(currentPath, item.name);
            
            if (item.isDirectory()) {
                // Skip common directories that don't contain docs
                if (!shouldSkipDirectory(item.name)) {
                    traverse(fullPath);
                }
            } else if (item.isFile()) {
                const ext = path.extname(item.name).toLowerCase();
                if (extensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    }
    
    traverse(dirPath);
    
    // Sort files for consistent ordering
    return files.sort();
}

/**
 * Determines if a directory should be skipped during traversal
 * @param {string} dirName - Directory name
 * @returns {boolean} True if directory should be skipped
 */
function shouldSkipDirectory(dirName) {
    const skipDirs = [
        'node_modules',
        '.git',
        'build',
        'dist',
        '.next',
        '.docusaurus',
        'coverage',
        '__pycache__'
    ];
    
    return skipDirs.includes(dirName) || dirName.startsWith('.');
}

/**
 * Gets files organized hierarchically based on folder structure and sidebar_position
 * @param {string} basePath - Base documentation path
 * @param {string} language - Language identifier ('typescript' or 'csharp')
 * @returns {Object} Hierarchically organized file structure
 */
function getHierarchicalFiles(basePath, language) {
    const mainPath = path.join(basePath, 'docs', 'main');
    const langPath = path.join(basePath, 'docs', language);
    
    const structure = {
        main: buildHierarchicalStructure(mainPath),
        language: buildHierarchicalStructure(langPath)
    };
    
    return structure;
}

/**
 * Builds hierarchical structure for a directory
 * @param {string} rootPath - Root directory path
 * @returns {Object} Hierarchical structure with folders and files
 */
function buildHierarchicalStructure(rootPath) {
    if (!fs.existsSync(rootPath)) {
        return {};
    }
    
    const structure = {};
    
    /**
     * Recursively processes a directory
     * @param {string} dirPath - Current directory path
     * @param {Object} currentLevel - Current level in the structure
     */
    function processDirectory(dirPath, currentLevel) {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        // Collect folders and files separately
        const folders = [];
        const files = [];
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            
            if (item.isDirectory() && !shouldSkipDirectory(item.name)) {
                // Process subdirectory
                const readmePath = path.join(fullPath, 'README.md');
                let folderOrder = 999;
                let folderTitle = item.name;
                
                // Get folder ordering from README.md
                if (fs.existsSync(readmePath)) {
                    try {
                        const readmeContent = fs.readFileSync(readmePath, 'utf8');
                        const frontmatterMatch = readmeContent.match(/^---\s*\n([\s\S]*?)\n---/);
                        if (frontmatterMatch) {
                            const frontmatter = parseFrontmatter(frontmatterMatch[1]);
                            folderOrder = frontmatter.sidebar_position || 999;
                            folderTitle = frontmatter.title || frontmatter.sidebar_label || formatFolderName(item.name);
                        }
                    } catch (error) {
                        // Ignore errors reading README
                    }
                }
                
                folders.push({
                    name: item.name,
                    title: folderTitle,
                    path: fullPath,
                    order: folderOrder
                });
            } else if (item.isFile() && (item.name.endsWith('.md') || item.name.endsWith('.mdx'))) {
                // Process file
                let fileOrder = 999;
                let fileTitle = item.name;
                
                try {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
                    if (frontmatterMatch) {
                        const frontmatter = parseFrontmatter(frontmatterMatch[1]);
                        fileOrder = frontmatter.sidebar_position || 999;
                        fileTitle = frontmatter.title || frontmatter.sidebar_label || formatFileName(item.name);
                    }
                } catch (error) {
                    // Ignore errors reading file
                }
                
                files.push({
                    name: item.name,
                    title: fileTitle,
                    path: fullPath,
                    order: fileOrder
                });
            }
        }
        
        // Sort files by order and add to current level
        files.sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.name.localeCompare(b.name);
        });
        
        if (files.length > 0) {
            if (!currentLevel.files) currentLevel.files = [];
            currentLevel.files.push(...files);
        }
        
        // Sort folders by order and process each one
        folders.sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return a.name.localeCompare(b.name);
        });
        
        if (!currentLevel.children) currentLevel.children = {};
        
        for (const folder of folders) {
            currentLevel.children[folder.name] = {
                title: folder.title,
                order: folder.order,
                path: folder.path,
                files: [],
                children: {}
            };
            
            // Recursively process subdirectory
            processDirectory(folder.path, currentLevel.children[folder.name]);
        }
    }
    
    // Create a temporary wrapper to handle the root properly
    const tempWrapper = { files: [], children: {} };
    processDirectory(rootPath, tempWrapper);
    
    // Return the children (which contain the actual folder structure)
    return tempWrapper.children;
}

/**
 * Parses simple frontmatter
 * @param {string} frontmatterText - Frontmatter content
 * @returns {Object} Parsed frontmatter
 */
function parseFrontmatter(frontmatterText) {
    const frontmatter = {};
    const lines = frontmatterText.split('\n');
    
    for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
            let value = match[2].trim();
            
            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            // Convert numbers
            if (/^\d+$/.test(value)) {
                value = parseInt(value, 10);
            }
            
            frontmatter[match[1]] = value;
        }
    }
    
    return frontmatter;
}

/**
 * Formats folder name for display
 * @param {string} folderName - Raw folder name
 * @returns {string} Formatted folder name
 */
function formatFolderName(folderName) {
    return folderName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formats file name for display
 * @param {string} fileName - Raw file name
 * @returns {string} Formatted file name
 */
function formatFileName(fileName) {
    return path.basename(fileName, path.extname(fileName))
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Gets priority files for small version generation
 * @param {Object} organized - Organized file structure from getOrganizedFiles
 * @returns {Array<string>} Priority files for small version
 */
function getPriorityFiles(organized) {
    const priorityFiles = [];
    
    // Add welcome/overview files
    priorityFiles.push(...organized.main.welcome);
    
    // Add key team concepts
    const keyTeamFiles = organized.main.teams.filter(file => 
        file.includes('core-concepts') || 
        file.includes('README.md')
    );
    priorityFiles.push(...keyTeamFiles);
    
    // Add getting started files
    priorityFiles.push(...organized.language.gettingStarted);
    
    // Add essential README files
    const essentialReadmes = organized.language.essentials.filter(file => 
        file.includes('README.md') || 
        file.includes('app-basics')
    );
    priorityFiles.push(...essentialReadmes);
    
    return priorityFiles;
}

module.exports = {
    collectFiles,
    getHierarchicalFiles,
    getPriorityFiles,
    shouldSkipDirectory,
    buildHierarchicalStructure
};