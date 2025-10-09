const fs = require('fs');

/**
 * Regular expression to match YAML frontmatter at the start of a file
 * Matches content between --- delimiters
 */
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---/;

/**
 * Parser for YAML frontmatter in markdown/MDX files
 */
class FrontmatterParser {
    /**
     * Extracts and parses frontmatter from content
     * @param {string} content - Raw file content
     * @returns {Object} Object with parsed frontmatter and content without frontmatter
     */
    static extract(content) {
        const match = content.match(FRONTMATTER_REGEX);

        if (!match) {
            return {
                frontmatter: {},
                content: content,
                hasFrontmatter: false
            };
        }

        const frontmatter = this.parse(match[1]);
        const contentWithoutFrontmatter = content.replace(match[0], '').trimStart();

        return {
            frontmatter,
            content: contentWithoutFrontmatter,
            hasFrontmatter: true
        };
    }

    /**
     * Parses frontmatter text into an object
     * @param {string} frontmatterText - Raw frontmatter content (without --- delimiters)
     * @returns {Object} Parsed frontmatter object
     */
    static parse(frontmatterText) {
        const frontmatter = {};
        const lines = frontmatterText.split('\n');

        for (const line of lines) {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (!match) continue;

            const key = match[1];
            let value = match[2].trim();

            value = this._parseValue(value);
            frontmatter[key] = value;
        }

        return frontmatter;
    }

    /**
     * Extracts frontmatter from a file
     * @param {string} filePath - Path to the file
     * @returns {Object|null} Parsed frontmatter or null if file doesn't exist
     */
    static extractFromFile(filePath) {
        if (!fs.existsSync(filePath)) {
            return null;
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return this.extract(content);
        } catch (error) {
            console.warn(`⚠️ Error reading frontmatter from ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * Gets a specific property from frontmatter
     * @param {string} content - File content or path
     * @param {string} propertyName - Property to extract
     * @param {*} defaultValue - Default value if property not found
     * @returns {*} Property value or default
     */
    static getProperty(content, propertyName, defaultValue = undefined) {
        const { frontmatter } = typeof content === 'string' && fs.existsSync(content)
            ? this.extractFromFile(content)
            : this.extract(content);

        return frontmatter[propertyName] !== undefined
            ? frontmatter[propertyName]
            : defaultValue;
    }

    /**
     * Checks if a file or content should be ignored based on frontmatter
     * @param {string} content - File content or path
     * @returns {boolean} True if should be ignored
     */
    static shouldIgnore(content) {
        const { frontmatter } = typeof content === 'string' && fs.existsSync(content)
            ? this.extractFromFile(content)
            : this.extract(content);

        const llmsValue = frontmatter.llms;
        return llmsValue === 'ignore' || llmsValue === 'ignore-file' || llmsValue === false;
    }

    /**
     * Parses a value from frontmatter, converting types as needed
     * @private
     * @param {string} value - Raw value string
     * @returns {*} Parsed value (string, number, boolean)
     */
    static _parseValue(value) {
        // Remove surrounding quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            return value.slice(1, -1);
        }

        // Parse booleans
        if (value === 'true') return true;
        if (value === 'false') return false;

        // Parse integers
        if (/^\d+$/.test(value)) {
            return parseInt(value, 10);
        }

        // Return as string
        return value;
    }
}

module.exports = FrontmatterParser;
