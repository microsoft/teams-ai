# Language Selector Plugin for mdBook

A plugin that allows users to switch between different programming language versions of the documentation (e.g., TypeScript and C#).

<!-- ## Installation

1. Copy the `lang` directory to your mdBook's `theme` directory
2. Add the following to your `book.toml`:

```toml
[output.html]
additional-js = ["theme/lang/lang.js"]
additional-css = ["theme/lang/lang.css"]
```
-->

3. Add the language selector HTML to your `theme/index.hbs` file:

```handlebars
<button id="lang-toggle" class="icon-button" type="button" title="Select programming language" aria-label="Select programming language" aria-haspopup="true" aria-expanded="false" aria-controls="lang-list">
    <i class="fa fa-code"></i>
</button>
<ul id="lang-list" class="theme-popup" aria-label="Languages" role="menu">
    <li role="none"><button role="menuitem" class="theme" id="lang-ts" data-lang="ts">TypeScript</button></li>
    <li role="none"><button role="menuitem" class="theme" id="lang-cs" data-lang="cs">.NET</button></li>
</ul>
```

## Usage

### In Markdown Files

Mark language-specific sections in your markdown files using the following syntax:

```markdown
{{#lang=ts name=prerequisites}}
{{#lang=cs name=prerequisites}}
```

This tells the plugin to insert the corresponding snippet from the language-specific file at this point.

### Language-Specific Files

Create language-specific files in a `_lang` folder inside the directory where your markdown file resides:

```
getting-started/
├── quickstart.md
└── _lang/
    ├── _lang.quickstart.ts.md
    └── _lang.quickstart.cs.md
```

Each snippet is wrapped as:

```markdown
{{#lang name=prerequisites}}
...any markdown, including code blocks, lists, etc...
{{#lang}}
```

If a snippet is left empty for migration, it will look like:

```markdown
{{#lang name=prerequisites}}
<!-- Migrate content -->
{{#lang}}
```

**Section names** are inferred from the nearest preceding heading (e.g., `## Prerequisites` → `prerequisites`). If no heading is found, a default like `section1`, `section2`, etc. is used.

## Features

- **Language Selection**: Dropdown menu in the top navigation bar
- **Persistent Selection**: Remembers user's language preference
- **URL Parameter Support**: Switch languages via URL parameter
- **Responsive UI**: Works on all screen sizes
- **Accessibility**:
  - ARIA labels for screen readers
  - Loading state announcements
  - Error state announcements
  - Keyboard navigation support

## Supported Languages

Currently supports:
- TypeScript (`ts`)
- C# (`cs`)

## How It Works

1. The language selector is added to the top navigation bar via `index.hbs`
2. When a language is selected:
   - The preference is saved to localStorage
   - The corresponding language file is loaded from the `_lang` folder
   - Content is updated with language-specific parts
   - A loading indicator is shown during content fetch
   - Screen readers are notified of the change

## Build Process

When running `npm run docs:build`, the build process will:
1. Create `_lang` folders in directories containing language-specific content
2. Update `book.toml` to include the language files in the build
3. Copy the language files to the build directory
