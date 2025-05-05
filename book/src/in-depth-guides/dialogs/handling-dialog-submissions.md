# Handling Dialog Submissions

Dialogs have a specific `dialog.submit` event to handle submissions. When a user submits a form inside a dialog, the app is notified via this event, which is then handled to process the submission values, and can either send a response or proceed to more steps in the dialogs (see [Multi-step Dialogs](./handling-multi-step-forms.md)).

In this example, we show how to handle dialog submissions from an Adaptive Card form:

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.dialog-submission.ts }}
```
<!-- langtabs-end -->

Similarly, handling dialog submissions from rendered webpages is also possible:

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.dialog-submission-webpage.ts }}
```
<!-- langtabs-end -->
