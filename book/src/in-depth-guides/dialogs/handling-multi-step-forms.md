# Handling multi-step forms

Dialogs can become complex yet powerful with multi-step forms. These forms can alter the flow of the survey depending on the user's input or customize subsequent steps based on previous answers.

Start off by sending an initial card in the `dialog.open` event.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.dialog-multi-step-step-1.ts }}
```
<!-- langtabs-end -->

Then in the submission handler, you can choose to `continue` the dialog with a different card.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.dialog-submission-multistep.ts }}
```
<!-- langtabs-end -->
