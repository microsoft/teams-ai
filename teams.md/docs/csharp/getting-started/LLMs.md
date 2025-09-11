---
summary: Links to LLM context files for coding assistants to access C# Teams AI documentation for development support.
ignore: true
---

# LLMs.txt

A common practice to speed up development is using Coding Assistants. To better fascilitate this usage, you can provide your coding assistant sufficient context about this library by linking your assistant to the library's llms.txt files:

Small: [llms_csharp.txt](https://microsoft.github.io/teams-ai/llms_docs/llms_csharp.txt) - This file contains an index of the various pages in the C# documentation. The agent needs to selectively read the relevant pages to answer questions and help with development.

Large: [llms_csharp_full.txt](https://microsoft.github.io/teams-ai/llms_docs/llms_csharp_full.txt) - This file contains the full content of the C# documentation, including all pages and code snippets. The agent can keep the entire documentation in memory to answer questions and help with development.