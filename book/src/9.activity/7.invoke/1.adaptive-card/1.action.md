# Activity: Adaptive Card Action Invoke

The invoke `name` for Adaptive Cards is `adaptiveCard/action`. However, it is also possible to use the alias `card.action` to invoke an Adaptive Card.

```typescript
// Short-hand form of invoking an Adaptive Card
app.on('card.action', async ({ activity }) => {});
```

## Invoke value

The `Activity.value` field of the invoke activity for an Adaptive Card is `AdaptiveCardInvokeValue`. This structure of this type of invoke includes:

- `action`: `AdaptiveCardInvokeAction` - The action that was performed on the card.
- `authentication`: `AdaptiveCardAuthentication` - The authentication request for the card.
- `state`: `string` - magic code for OAuth.
- `trigger`: `'manual'` - what triggered the action.

## Resources

- [Microsoft Learn: `AdaptiveCardInvokeValue`](https://learn.microsoft.com/en-us/javascript/api/botframework-schema/adaptivecardinvokevalue?view=botbuilder-ts-latest)
