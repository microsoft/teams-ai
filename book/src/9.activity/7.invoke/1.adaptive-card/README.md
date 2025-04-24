# Activity: Adaptive Card Invoke

[Adaptive Cards](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/cards-reference#adaptive-card) are a way to send rich content to users. They can be used to send messages, notifications, or to display information.

Invokes on Adaptive Cards are used to perform some action dependent on interaction from the user.

```typescript
// Long-hand form of retrieving the invoke value
app.on('invoke', async ({ activity }) => {
  if (activity.name === 'adaptiveCard/action') {
    const { action } = activity.value;
  }
});
```

The name of the invoke activity for Adaptive Cards is `adaptiveCard/action`. However, the `@microsoft/teams.api` package includes an alias for this invoke activity, `card.action`.

See the next section for more information on the `value` field of the invoke activity.

## Resources

- [Microsoft Learn: AC invokes](https://learn.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/cards-actions?tabs=json#action-type-invoke)
