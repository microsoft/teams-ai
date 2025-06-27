# LLMs.txt

Using Coding Assistants is a common practice now to help speed up development. To aid with this, you can provide your coding assistant sufficient context about this library by linking it to its llms.txt files:

Small: [llms_csharp.txt](/llms_csharp.txt) - This file contains an index of the various pages in the C# documentation. The agent needs to selectively read the relevant pages to answer questions and help with development.

Large: [llms_csharp_fill.txt](/llms_csharp_fill.txt) - This file contains the full content of the C# documentation, including all pages and code snippets. The agent can keep the entire documentation in memory to answer questions and help with development.