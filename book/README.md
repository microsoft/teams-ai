# Teams AI SDK Docs

These docs are built using [mdbook](https://github.com/rust-lang/mdBook).

## Prerequisites

- [mdbook](https://github.com/rust-lang/mdBook)
- [mdbook-mermaid](https://github.com/badboy/mdbook-mermaid)

## Building

```bash
npm run docs:build
```

## Running

```bash
npm run docs:serve
```

> [!CAUTION]
> `serve` will include a bunch of websocket code in the output code. Before committing, make sure you run `npm run docs:build`.



