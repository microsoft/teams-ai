---
summary: Links to LLM context files that provide coding assistants with documentation for the Teams AI TypeScript library.
llms: ignore
---

# LLMs.txt

Using Coding Assistants is a common practice now to help speed up development. To aid with this, you can provide your coding assistant sufficient context about this library by linking it to its llms.txt files:

Small: [llm_typescript.txt](https://microsoft.github.io/teams-ai/llms_docs/llms_typescript.txt) - This file contains an index of the various pages in the TypeScript documentation. The agent needs to selectively read the relevant pages to answer questions and help with development.

Large: [llm_typescript_full.txt](https://microsoft.github.io/teams-ai/llms_docs/llms_typescript_full.txt) - This file contains the full content of the TypeScript documentation, including all pages and code snippets. The agent can keep the entire documentation in memory to answer questions and help with development.