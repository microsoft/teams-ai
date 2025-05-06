# Proactive Messaging

In [Sending Messages](./sending-messages.md), we show how we can respond to an event when it happens. However, there are times when you want to send a message to the user without them sending a message first. This is called proactive messaging. You can do this by using the `send` method in the `app` instance. This is useful for sending notifications or reminders to the user.

The main thing to note is that you need to have the `conversationId` of the chat or channel you want to send the message to. It's a good idea to store this value somewhere from an activity handler so you can use it for proactive messaging later.

<!-- langtabs-start -->
```typescript
{{#include ../../generated-snippets/ts/index.snippet.proactive-messaging-prepare.ts}}
```
<!-- langtabs-end -->

Then, when you want to send a proactive message, you can retrieve the `conversationId` from storage and use it to send the message.

<!-- langtabs-start -->
```typescript
{{#include ../../generated-snippets/ts/index.snippet.proactive-messaging-send.ts}}
```
<!-- langtabs-end -->

> [!TIP]
> In this example, we show that we get the conversation id using one of the activity handlers. This is a good place to store the conversation id, but you can also do this in other places like when the user installs the app or when they sign in. The important thing is that you have the conversation id stored somewhere so you can use it later.
