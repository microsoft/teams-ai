# Functions

It's possible to hook up functions that the LLM can decide to call if it thinks it can help with the task at hand. This is done by adding a `function` to the `ChatPrompt`.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/tool-calling.snippet.single-function-calling.ts }}
```
<!-- langtabs-end -->

## Multiple functions

Additionally, for complex scenarios, you can add multiple functions to the `ChatPrompt`. The LLM will then decide which function to call based on the context of the conversation. The LLM can pick one or more functions to call before returning the final response.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/tool-calling.snippet.multiple-function-calling.ts }}
```
<!-- langtabs-end -->
