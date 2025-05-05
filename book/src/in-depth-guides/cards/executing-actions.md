# Executing Actions

Adaptive Cards support interactive elements through **actions**—buttons, links, and input submission triggers that respond to user interaction.  
You can use these to collect form input, trigger workflows, show task modules, open URLs, and more.

---

## Action Types

The Teams AI Library supports several action types for different interaction patterns:

| Action Type               | Purpose                | Description                                                                  |
| ------------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `Action.Execute`          | Server‑side processing | Send data to your bot for processing. Best for forms & multi‑step workflows. |
| `Action.Submit`           | Simple data submission | Legacy action type. Prefer `Execute` for new projects.                       |
| `Action.OpenUrl`          | External navigation    | Open a URL in the user's browser.                                            |
| `Action.ShowCard`         | Progressive disclosure | Display a nested card when clicked.                                          |
| `Action.ToggleVisibility` | UI state management    | Show/hide card elements dynamically.                                         |

> For complete reference, see the [official documentation](https://adaptivecards.microsoft.com/?topic=Action.Execute).

---

## Creating Actions with the SDK

### Single Actions

The SDK provides builder helpers that abstract the underlying JSON. For example:

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.single-action.ts }}
```
<!-- langtabs-end -->

### Action Sets

Group actions together using `ActionSet`:

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.multiple-actions-card.ts }}
```
<!-- langtabs-end -->

### Raw JSON Alternative

Just like when building cards, if you prefer to work with raw JSON, you can do just that. You get typesafety for free in typescript.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.raw-json-action.ts }}
```
<!-- langtabs-end -->

---

## Working with Input Values

### Associating data with the cards

Sometimes you want to send a card and have it be associated with some data. Set the `data` value to be sent back to the client so you can associate it with a particular entity.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.inputs-included.ts }}
```
<!-- langtabs-end -->

### Input Validation

Input Controls provide ways for you to validate. More details can be found on the Adaptive Cards [documentation](https://adaptivecards.microsoft.com/?topic=input-validation).

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.input-validation.ts }}
```
<!-- langtabs-end -->

---

## 4 Server‑side Handlers

### Basic Structure

Card actions arrive as `card.action` activities in your app. These give you access to the validated input values plus any `data` values you had configured to be sent back to you.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.message-handler.ts }}
```
<!-- langtabs-end -->

> [!NOTE]
> The `data` values are not typed and come as `any`, so you will need to cast them to the correct type in this case.
