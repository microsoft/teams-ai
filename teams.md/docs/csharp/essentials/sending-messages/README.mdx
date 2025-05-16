---
sidebar_position: 4
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Sending Messages

Sending messages is a core part of an agent's functionality. With all activity handlers, a `Send` method is provided which allows your handlers to send a message back to the user to the relevant conversation. 

<Tabs>
  <TabItem label="Controller" value="controller" default>
    ```csharp 
    [Message]
    public async Task OnMessage([Context] MessageActivity activity, [Context] IContext.Client client)
    {
        await client.Send($"you said: {activity.Text}");
    }
    ```
  </TabItem>
  <TabItem label="Minimal" value="minimal">
    ```csharp 
    app.OnMessage(async context =>
    {
        await context.Send($"you said: {context.activity.Text}");
    });
    ```
  </TabItem>
</Tabs>

In the above example, the handler gets a `message` activity, and uses the `send` method to send a reply to the user.

<Tabs>
  <TabItem label="Controller" value="controller" default>
    ```csharp 
    [SignIn.VerifyState]
    public async Task OnVerifyState([Context] SignIn.VerifyStateActivity activity, [Context] IContext.Client client)
    {
        await client.Send("You have successfully signed in!");
    }
    ```
  </TabItem>
  <TabItem label="Minimal" value="minimal">
    ```csharp 
    app.OnVerifyState(async context =>
    {
        await context.Send("You have successfully signed in!");
    });
    ```
  </TabItem>
</Tabs>

You are not restricted to only replying to `message` activities. In the above example, the handler is listening to `SignIn.VerifyState` events, which are sent when a user successfully signs in. 

:::tip
This shows an example of sending a text message. Additionally, you are able to send back things like [adaptive cards](../../in-depth-guides/adaptive-cards) by using the same `Send` method. Look at the [adaptive card](../../in-depth-guides/adaptive-cards) section for more details.
:::

## Streaming

You may also stream messages to the user which can be useful for long messages, or AI generated messages. The library makes this simple for you by providing a `Stream` function which you can use to send messages in chunks. 

<Tabs>
  <TabItem label="Controller" value="controller" default>
    ```csharp 
    [Message]
    public void OnMessage([Context] MessageActivity activity, [Context] IStreamer stream)
    {
        stream.Emit("hello");
        stream.Emit(", ");
        stream.Emit("world!");
        // result message: "hello, world!"
    }
    ```
  </TabItem>
  <TabItem label="Minimal" value="minimal">
    ```csharp 
    app.OnMessage(async context =>
    {
        context.Stream.Emit("hello");
        context.Stream.Emit(", ");
        context.Stream.Emit("world!");
        // result message: "hello, world!"
        return Task.CompletedTask;
    });
    ```
  </TabItem>
</Tabs>

:::note
Streaming is currently only supported in 1:1 conversations, not group chats or channels
:::

![Streaming Example](/screenshots/streaming-chat.gif)

## @Mention

Sending a message at `@mentions` a user is as simple including the details of the user using the `AddMention` method

<Tabs>
  <TabItem label="Controller" value="controller" default>
    ```csharp 
    [Message]
    public async Task OnMessage([Context] MessageActivity activity, [Context] IContext.Client client)
    {
        await client.Send(new MessageActivity("hi!").AddMention(activity.From));
    }
    ```
  </TabItem>
  <TabItem label="Minimal" value="minimal">
    ```csharp 
    app.OnMessage(async context =>
    {
        await context.Send(new MessageActivity("hi!").AddMention(activity.From));
    });
    ```
  </TabItem>
</Tabs>
