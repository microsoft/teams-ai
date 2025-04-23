# Teams AI Library Docs

These docs are built using [mdbook](https://github.com/rust-lang/mdBook).

## Prerequisites

- [mdbook](https://github.com/rust-lang/mdBook)
- [mdbook-theme](https://github.com/zjp-CN/mdbook-theme)
- [mdbook-mermaid](https://github.com/badboy/mdbook-mermaid)
- [mdbook-alerts](https://github.com/lambdalisue/rs-mdbook-alerts)

## Build

```bash
npm run docs:build
```

## Run

```bash
npm run docs:serve
```

## To include snippets

You can include unit-tested snippets in the documentation. It dramatically increases the confidence in the documentation.

1. First you want to create a unit test with these snippets. We use bluehawk to do this. Check out their docs here: https://mongodb-university.github.io/Bluehawk/code-snippets/
2. Then you need to generate the snippets. Run `npm run generate:snippets` to generate the snippets.
3. Finally, you can include the snippets in your markdown files. Use the following syntax:

```markdown
// Inside a codeblock
{{#include <path-to-snippet> }}
```
