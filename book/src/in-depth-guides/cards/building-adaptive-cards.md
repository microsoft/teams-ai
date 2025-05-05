# Building Adaptive Cards

Adaptive Cards are JSON payloads that describe rich, interactive UI fragments.
With `@microsoft/teams.cards` you can build these cards entirely in TypeScript / JavaScript while enjoying full IntelliSense and compiler safety.

---

## The Builder Pattern

`@microsoft/teams.cards` exposes small **builder helpers** (`Card`, `TextBlock`, `ToggleInput`, `ExecuteAction`, _etc._).
Each helper wraps raw JSON and provides fluent, chainable methods that keep your code concise and readable.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.basic-card-building.ts }}
```
<!-- langtabs-end -->

Benefits:

| Benefit     | Description                                                                   |
| ----------- | ----------------------------------------------------------------------------- |
| Readability | No deep JSON trees—just chain simple methods.                                 |
| Re‑use      | Extract snippets to functions or classes and share across cards.              |
| Safety      | Builders validate every property against the Adaptive Card schema (see next). |

> Source code lives in `teams.ts/packages/cards/src/`. Feel free to inspect or extend the helpers for your own needs.

---

## Type‑safe Authoring & IntelliSense

The package bundles the **Adaptive Card v1.5 schema** as strict TypeScript types.
While coding you get:

- **Autocomplete** for every element and attribute.
- **In‑editor validation**—invalid enum values or missing required properties produce build errors.
- Automatic upgrades when the schema evolves; simply update the package.

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.improved-type-checking.ts }}
```
<!-- langtabs-end -->

---

## The Visual Designer

Prefer a drag‑and‑drop approach? Use [Microsoft's Adaptive Card Designer](https://adaptivecards.microsoft.com/designer.html):

1. Add elements visually until the card looks right.
2. Copy the JSON payload from the editor pane.
3. Paste the JSON into your project **or** convert it to builder calls:

<!-- langtabs-start -->
```typescript
const cardJson = /* copied JSON */;
const card = new Card().withBody(cardJson);
```
<!-- langtabs-end -->

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.raw-card-json.ts }}
```
<!-- langtabs-end -->

This method leverages the full Adaptive Card schema and ensures that the payload adheres strictly to `ICard`.

> [!TIP]
> You can use a combination of raw JSON and builder helpers depending on whatever you find easier.

---

## End‑to‑end Example – Task Form Card

Below is a complete example showing a task management form. Notice how the builder pattern keeps the file readable and maintainable:

<!-- langtabs-start -->
```typescript
{{#include ../../../generated-snippets/ts/index.snippet.sending-adaptive-card-e2e.ts }}
```
<!-- langtabs-end -->

---

## Additional Resources

- **Official Adaptive Card Documentation** — <https://adaptivecards.microsoft.com/>
- **Adaptive Cards Designer** — <https://adaptivecards.microsoft.com/designer.html>

---

### Summary

- Use **builder helpers** for readable, maintainable card code.
- Enjoy **full type safety** and IDE assistance.
- Prototype quickly in the **visual designer** and refine with builders.

Happy card building! 🎉
