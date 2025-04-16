# ✍ Writing Documentation

> [**ℹ️ Note**]
> Do not make edits to the `/docs/` directory, as these files are auto-generated.

One of the most important aspects of a library is great documentation. If you make any code changes, please be sure to update the documentation to reflect the changes. Please see below for details on how to edit the documentation.

## Introducing `mdbook`

mdbook is a tool that allows you to write documentation in markdown. Please see the [`mdbook` documentation](https://rust-lang.github.io/mdBook/index.html) for detailed documentation on editing and adding content.

## Installing mdbook

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

- Run `cargo install mdbook` to install the mdbook CLI globally.
- Run `cargo install mdbook-theme` to install the theme CLI.

## Running the book locally

- At the root of the repo, run `npm run docs:serve` to start the book locally.
- This will start the book on [http://localhost:3000](http://localhost:3000). The book will automatically reload as you save changes.

## Adding content

- To add content, create a new markdown file in the `book/src` directory.
- To add a new section, create a new directory in the `book/src` directory and add a `README.md` file to it.
- Be sure to update the `SUMMARY.md` file to include your new content.
- Sub-chapters should be added as a folder under the section with a new `README.md` file.

## Finishing up

- Once you have finished making changes, run `npm run docs:build` to build the book.
- This will convert the markdown files to html and place them in the `/docs` directory.
- Be sure to test the book locally to ensure your changes are correct.
