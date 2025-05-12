// Supported languages
const LANGUAGES = {
    ts: { name: 'TypeScript', code: 'ts' },
    cs: { name: 'C#', code: 'cs' }
    // Python support coming soon
    // py: { name: 'Python', code: 'py' }
};

console.log('Lang selector loaded');
// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LANGUAGES };
}

// Browser-specific code
if (typeof document !== 'undefined') {
  (function() {
    /**
     * Initializes the language selector
     */
    function initLangSelector() {
        const langToggle = document.getElementById('lang-toggle');
        const langList = document.getElementById('lang-list');

        if (!langToggle || !langList) return;

        // Set initial value
        const currentLang = getCurrentLang();
        const currentButton = document.getElementById(`lang-${currentLang}`);
        if (currentButton) {
            currentButton.classList.add('active');
        }

        // Toggle dropdown
        langToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            const isExpanded = langToggle.getAttribute('aria-expanded') === 'true';
            langToggle.setAttribute('aria-expanded', !isExpanded);
            langList.style.display = isExpanded ? 'none' : 'block';
        });

        // Handle language selection
        langList.addEventListener('click', function(e) {
            const button = e.target.closest('button');
            if (!button) return;

            const lang = button.dataset.lang;
            if (lang) {
                localStorage.setItem('preferred-lang', lang);
                updateLangContent(lang);
                langToggle.setAttribute('aria-expanded', 'false');
                langList.style.display = 'none';
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!langList.contains(e.target) && !langToggle.contains(e.target)) {
                langToggle.setAttribute('aria-expanded', 'false');
                langList.style.display = 'none';
            }
        });
    }

    /**
     * Gets the current language preference
     * @returns {string} The language code
     */
    function getCurrentLang() {
        return localStorage.getItem('preferred-lang') || 'ts';
    }

    /**
     * Loads language-specific content for a given section
     * @param {string} sectionName - The name of the section to load
     * @param {string} lang - The language code
     * @returns {Promise<string>} The language-specific content
     */
    async function loadLangContent(sectionName, lang) {
        console.log('loadLangContent called for', sectionName, lang);
        const currentPath = window.location.pathname;
        const dir = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const file = currentPath.substring(currentPath.lastIndexOf('/') + 1).replace(/\.html$/, '');
        const langFile = `${dir}/_lang/_lang.${file}.${lang}.md`;
        console.log('Fetching:', langFile);
        try {
            const response = await fetch(langFile);
            if (!response.ok) return `<!-- Snippet '${sectionName}' not found for ${lang} -->`;
            const content = await response.text();
            // Find the snippet for this section
            const partRegex = new RegExp(`{{#lang name=${sectionName}}}([\s\S]*?){{#lang}}`, 'i');
            const match = content.match(partRegex);
            if (!match) return `<!-- Snippet '${sectionName}' not found for ${lang} -->`;
            console.log('Fetch response:', response);
            return match[1].trim();
        } catch {
            return `<!-- Snippet '${sectionName}' not found for ${lang} -->`;
        }
    }

    /**
     * Updates the content with language-specific parts
     * @param {string} lang - The language code
     */
    async function updateLangContent(lang) {
        const content = document.querySelector('.content');
        if (!content) return;
        console.log('updateLangContent running');
        // Replace <p>{{#lang=ts name=section}}</p> with snippet for block-level support
        const paragraphs = content.querySelectorAll('p');
        console.log('All paragraphs:', Array.from(paragraphs).map(p => JSON.stringify(p.textContent)));
        const markerRegex = /#lang=([a-z]+) name=([a-z0-9\-_]+)/i;
        for (const p of paragraphs) {
            const text = p.textContent.replace(/\s+/g, ' ').trim();
            console.log('Normalized paragraph:', JSON.stringify(text));
            const match = text.match(markerRegex);
            console.log('Match result:', match);
            console.log('match[1]:', JSON.stringify(match && match[1]), 'lang:', JSON.stringify(lang));
            if (match) {
                try {
                    const sectionName = match[2];
                    console.log('Matched marker for section:', sectionName, 'lang:', lang);
                    const snippet = await loadLangContent(sectionName, lang);
                    const temp = document.createElement('div');
                    temp.innerHTML = snippet;
                    // Insert all children of temp before p
                    while (temp.firstChild) {
                        p.parentNode.insertBefore(temp.firstChild, p);
                    }
                    p.remove();
                } catch (err) {
                    console.error('Error in snippet replacement:', err);
                }
            }
        }
        // Fallback: also replace inline markers in .content (for legacy/inline usage)
        let html = content.innerHTML;
        const inlineMarkerRegex = /{{#lang=([a-z]+) name=([a-z0-9\-_]+)}}/gi;
        let match;
        const replacements = [];
        while ((match = inlineMarkerRegex.exec(html)) !== null) {
            const markerLang = match[1];
            const sectionName = match[2];
            if (markerLang !== lang) continue;
            // Note: loadLangContent is async, so we can't await here in a regex loop
            // Instead, skip inline replacement if block-level already handled it
            // (or, for full async, refactor to use DOM traversal only)
        }
        // No-op for now, as block-level replacement is preferred
    }

        if (window.book) {
        window.book.registerPlugin('lang', {
            onPageChanged: function() {
                const currentLang = getCurrentLang();
                updateLangContent(currentLang);
            }
        });
    }

    window.addEventListener('hashchange', () => {
        const currentLang = getCurrentLang();
        updateLangContent(currentLang);
    });

    // Initialize when the DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        initLangSelector();
        const currentLang = getCurrentLang();
        updateLangContent(currentLang);
    });
  })();
}
