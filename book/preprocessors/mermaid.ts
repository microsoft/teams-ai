#!/usr/bin/env node

import { execSync } from "child_process";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";

/**
 * Based off of how preprocessors in mdbook work:
 * https://rust-lang.github.io/mdBook/for_developers/preprocessors.html#hooking-into-mdbook
 */

// Types matching Rust structs from https://docs.rs/mdbook/latest/mdbook/book/struct.Book.html
interface SectionNumber {
  // We don't need the internal structure for our use case
  [key: string]: any;
}

interface Chapter {
  name: string;
  content: string;
  number?: SectionNumber;
  sub_items: BookItem[];
  path?: string;
  source_path?: string;
  parent_names: string[];
}

type BookItem =
  | { Chapter: Chapter }
  | { Separator: null }
  | { PartTitle: string };

interface Book {
  sections: BookItem[];
}

interface PreprocessorContext {
  root: string;
  config: {
    book: any;
    preprocessor?: {
      mermaid?: {
        debug?: boolean;
      };
    };
  };
  renderer: string;
  mdbook_version: string;
}

// Debug logging setup - need to debug to a file because we can't use console.log
// since this is a stdin/stdout preprocessor
const DEBUG_LOG = path.join(__dirname, "mermaid-debug.log");
let isDebugEnabled = false;

async function debug(msg: string): Promise<void> {
  if (!isDebugEnabled) return;

  await fs
    .appendFile(DEBUG_LOG, `${new Date().toISOString()}: ${msg}\n`)
    .catch(() => {});
}

// Clear previous debug log
async function initDebug(context: PreprocessorContext) {
  isDebugEnabled = context.config?.preprocessor?.mermaid?.debug === true;
  if (!isDebugEnabled) return;

  await fs.writeFile(DEBUG_LOG, "--- New Build Started ---\n").catch(() => {});
}

// Check if we're being asked about renderer support
if (process.argv.length > 2 && process.argv[2] === "supports") {
  // We support all renderers
  process.exit(0);
}

// Read the JSON from stdin
let input = "";
process.stdin.on("data", (chunk: Buffer) => (input += chunk));

process.stdin.on("end", async () => {
  try {
    // Parse the input JSON
    const [context, book]: [PreprocessorContext, Book] = JSON.parse(input);

    // Initialize debug logging based on config
    await initDebug(context);
    await debug("Received input, starting processing...");
    await debug(`Context: ${JSON.stringify(context, null, 2)}`);

    // Process each section recursively
    await processBook(book);

    await debug("Processing complete, outputting modified book");
    // Output the modified book
    console.log(JSON.stringify(book));
  } catch (error) {
    await debug(
      `Error processing book: ${error instanceof Error ? error.stack : String(error)}`
    );
    console.error("Error processing book:", error);
    process.exit(1);
  }
});

async function processBookItem(item: BookItem): Promise<void> {
  if ("Chapter" in item) {
    await debug(`Processing chapter: ${item.Chapter.name}`);
    // Process the chapter's content
    item.Chapter.content = await processContent(item.Chapter.content);

    // Process sub-items recursively
    if (item.Chapter.sub_items.length > 0) {
      await debug(
        `Processing ${item.Chapter.sub_items.length} sub-items for chapter ${item.Chapter.name}`
      );
      for (const subItem of item.Chapter.sub_items) {
        await processBookItem(subItem);
      }
    }
  }
  // We don't need to process Separator or PartTitle items
}

async function processBook(book: Book): Promise<void> {
  if (!book.sections) return;
  await debug(`Processing book with ${book.sections.length} sections`);

  for (const section of book.sections) {
    await processBookItem(section);
  }
}

async function processContent(content: string): Promise<string> {
  const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;
  let newContent = content;

  while ((match = mermaidRegex.exec(content)) !== null) {
    await debug("Found mermaid diagram:\n" + match[1]);
    const diagramCode = match[1];
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mdbook-mermaid-"));
    const inputFile = path.join(tempDir, "diagram.mmd");
    const outputFile = path.join(tempDir, "diagram.svg");

    await debug(`Using temp directory: ${tempDir}`);
    // Write diagram code to temp file
    await fs.writeFile(inputFile, diagramCode);

    try {
      await debug(`Running mermaid conversion`);

      // Use mmdc CLI directly
      const mmdc = path.join(
        __dirname,
        "..",
        "..",
        "node_modules",
        ".bin",
        "mmdc"
      );
      const result = execSync(
        `"${mmdc}" -i "${inputFile}" -o "${outputFile}"`,
        {
          stdio: "pipe",
          encoding: "utf-8",
        }
      );
      await debug("mmdc output: " + result);

      // Read the generated SVG
      const svg = await fs.readFile(outputFile, "utf8");
      await debug("Generated SVG length: " + svg.length);

      // Replace the mermaid code block with the SVG
      newContent = newContent.replace(match[0], svg);

      // Clean up temp files
      await fs.rm(tempDir, { recursive: true });
      await debug("Cleaned up temp directory");
    } catch (error) {
      await debug(
        `Error generating diagram: ${error instanceof Error ? error.stack : String(error)}`
      );
      console.error("Error generating diagram:", error);
      // Keep the original mermaid code block if generation fails
    }
  }

  return newContent;
}
