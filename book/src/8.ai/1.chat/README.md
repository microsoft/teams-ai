# 💬 Chat (Text)

## Chat Prompt

A `ChatPrompt` is a root-level concept which is a wrapper around the Chat Models. It abstracts away the details of the model and provides a simple, unified interface to interact with it. It takes in a variety of options that configure the way the prompt behaves.

To execute the prompt, you can use the `send` method. This method takes the incoming message (or list of messages), and passes it along to the model. It takes care of keeping a history, orchesterating tool calls, and handling streaming.
