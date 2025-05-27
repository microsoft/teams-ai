import type * as DocsPlugin from '@docusaurus/plugin-content-docs';
import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import path from 'node:path';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)
const baseUrl = '/teams-ai/';
const config: Config = {
  title: 'Teams AI Library (v2)',
  favicon: 'img/msft-logo-48x48.png',

  // Set the production url of your site here
  url: 'https://microsoft.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl,

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'microsoft', // Usually your GitHub org/user name.
  projectName: 'teams-ai', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  scripts: [path.join(baseUrl, '/scripts/clarity.js')],

  presets: [
    [
      'classic',
      {
        blog: false,
        docs: {
          routeBasePath: '/',
          path: 'docs/main',
          sidebarPath: './sidebars.ts',
          sidebarCollapsed: false,
          editUrl: 'https://github.com/microsoft/teams-ai/tree/v2-preview/teams.md/',
        },
        theme: {
          customCss: ['./src/css/custom.css', './src/css/code-blocks.css'],
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'typescript',
        path: 'docs/typescript',
        routeBasePath: '/typescript',
        sidebarPath: './sidebars.ts',
        sidebarCollapsed: true,
        editUrl: 'https://github.com/microsoft/teams-ai/tree/v2-preview/teams.md/',
      } satisfies Partial<DocsPlugin.PluginOptions>,
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'csharp',
        path: 'docs/csharp',
        routeBasePath: '/csharp',
        sidebarPath: './sidebars.ts',
        sidebarCollapsed: true,
        editUrl: 'https://github.com/microsoft/teams-ai/tree/v2-preview/teams.md/',
      } satisfies Partial<DocsPlugin.PluginOptions>,
    ],
  ],
  themes: [
    '@docusaurus/theme-mermaid',
    [require.resolve("@easyops-cn/docusaurus-search-local"),
    /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
    ({
      hashed: true,
      language: ['en'],
      docsRouteBasePath: ['/', '/typescript', '/csharp'],
      indexDocs: true,
      indexPages: true,
      highlightSearchTermsOnTargetPage: true
    })],
  ],
  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    announcementBar: {
      backgroundColor: '#515cc6',
      isCloseable: true,
      textColor: '#fff',
      content: '🎉️ Teams AI v2.0.0-preview is out! 🥳️',
    },
    navbar: {
      title: 'Teams AI (v2)',
      hideOnScroll: true,
      logo: {
        alt: 'Teams AI (v2)',
        src: 'img/teams.png',
      },
      items: [
        {
          to: 'typescript',
          position: 'left',
          label: 'Typescript',
        },
        {
          to: 'csharp',
          position: 'left',
          label: 'C#',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/microsoft/teams-ai/tree/v2-preview',
          position: 'right',
          className: 'header-github-link',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/',
            },
            {
              label: 'TypeScript',
              to: '/typescript/getting-started',
            },
            {
              label: 'C#',
              to: '/csharp/getting-started',
            },
            {
              label: 'Privacy policy',
              to: '/privacy',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/microsoft/teams-ai/tree/v2-preview',
            },
            {
              label: 'Contributing',
              href: 'https://github.com/microsoft/teams-ai/blob/v2-preview/CONTRIBUTING.md',
            },
            {
              label: 'Blog',
              href: 'https://devblogs.microsoft.com/microsoft365dev/announcing-the-updated-teams-ai-library-and-mcp-support/',
            },
            {
              label: 'Teams agent accelerator templates',
              href: 'https://microsoft.github.io/teams-agent-accelerator-templates/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Microsoft Corporation. All rights reserved.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      magicComments: [
        {
          className: 'theme-code-block-highlighted-line',
          line: 'highlight-next-line',
          block: {
            start: 'highlight-start',
            end: 'highlight-end',
          },
        },
        {
          className: 'code-block-error-line',
          line: 'highlight-error-line',
          block: {
            start: 'highlight-error-start',
            end: 'highlight-error-end',
          },
        },
        {
          className: 'code-block-success-line',
          line: 'highlight-success-line',
          block: {
            start: 'highlight-success-start',
            end: 'highlight-success-end',
          },
        },
      ],
      additionalLanguages: [
        'typescript',
        'javascript',
        'csharp',
        'python',
        'bash',
        'markdown',
        'json',
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
