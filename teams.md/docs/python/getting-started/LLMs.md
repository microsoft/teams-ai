---
summary: Links to LLM context files for coding assistants to access Python Teams AI documentation for development support.
ignore: true
---

# LLMs.txt

Using Coding Assistants is a common practice now to help speed up development. To aid with this, you can provide your coding assistant sufficient context about this library by linking it to its llms.txt files:

Small: [llms_python.txt](https://microsoft.github.io/teams-ai/llms_docs/llms_python.txt) - This file contains an index of the various pages in the Python documentation. The agent needs to selectively read the relevant pages to answer questions and help with development.

Large: [llms_python_full.txt](https://microsoft.github.io/teams-ai/llms_docs/llms_python_full.txt) - This file contains the full content of the Python documentation, including all pages and code snippets. The agent can keep the entire documentation in memory to answer questions and help with development.