# Basics

All middleware and activity handlers are given a context which can be used to
react to system events known as `Activities`.

## Logging

All contexts have access to the apps `Logger` instance.

```typescript
app.on('activity', async ({ log, activity }) => {
  log.info(activity);
  log.warn(activity);
  log.error(activity);
  log.debug(activity);
});
```
