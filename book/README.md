# Teams AI Library Docs

## Using `mdbook`

These docs are built using [mdbook](https://github.com/rust-lang/mdBook).

`mdbook` is a tool that allows you to write documentation in markdown. Please see the [`mdbook` documentation](https://rust-lang.github.io/mdBook/index.html) for detailed documentation on editing and adding content.

### Installing `mdbook`

- If you do not have cargo installed, please see the [rust installation guide](https://www.rust-lang.org/tools/install).
- Once cargo is installed, be sure to add cargo/env to your PATH and source it:

```sh
# Configure shell for cargo on Mac
cd $HOME/.cargo
ls # Should see a cargo/env file
source $HOME/.cargo/env
echo $PATH # Should see cargo/bin in the path
source ~/.zshrc # or ~/.bashrc
```


### Prerequisites

You will need to install the following packages to run the docs server via `cargo install __`.

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

## Include snippets

You can include unit-tested snippets in the documentation. It dramatically increases the confidence in the documentation.

1. First you want to create a unit test with these snippets. We use bluehawk to do this. Check out the [Bluehawk docs](https://mongodb-university.github.io/Bluehawk/code-snippets/).
2. Run `npm run gen:snips` to generate the snippets. These can be found under `book/generated-snippets`
3. Finally, you can include the snippets in your markdown files. Use the following syntax:

```markdown
// Inside a codeblock
{{#include <path-to-snippet> }}
```
