---
sidebar_position: 4
summary: Guide to managing conversation state in LLM interactions, explaining how to maintain chat history using ChatPrompt's state management capabilities and implementing custom persistence strategies for multi-conversation scenarios.
---

import FileCodeBlock from '@site/src/components/FileCodeBlock';

# Keeping State

By default, LLMs are not stateful. This means that they do not remember previous messages or context when generating a response.
It's common practice to keep state of the conversation history in your application and pass it to the LLM each time you make a request.

By default, the `ChatPrompt` instance will create a temporary in-memory store to keep track of the conversation history. This is beneficial
when you want to use it to generate an LLM response, but not persist the conversation history. But in other cases, you may want to keep the conversation history

:::warning
By reusing the same `ChatPrompt` class instance across multiple conversations will lead to the conversation history being shared across all conversations. Which is usually not the desired behavior.
:::

To avoid this, you need to get messages from your persistent (or in-memory) store and pass it in to the `ChatPrompt`.

:::note
The `ChatPrompt` class will modify the messages object that's passed into it. So if you want to manually manage it, you need to make a copy of the messages object before passing it in.
:::

```csharp
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.State;
using Microsoft.Bot.Schema;

// State initialization - Define your conversation state
public class ConversationState
{
    public List<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    public string ConversationId { get; set; } = string.Empty;
}

// Initialize state management
public class StateManager
{
    private readonly Dictionary<string, ConversationState> _conversations = new();

    public ConversationState GetOrCreateConversation(string conversationId)
    {
        if (!_conversations.ContainsKey(conversationId))
        {
            _conversations[conversationId] = new ConversationState
            {
                ConversationId = conversationId
            };
        }
        return _conversations[conversationId];
    }

    public void SaveConversation(ConversationState state)
    {
        _conversations[state.ConversationId] = state;
    }
}
```

```csharp
using Microsoft.Teams.AI;
using Microsoft.Teams.AI.Models.OpenAI;

// Stateful conversation management example
public class StatefulChatHandler
{
    private readonly StateManager _stateManager;
    private readonly OpenAIChatModel _model;

    public StatefulChatHandler(StateManager stateManager, OpenAIChatModel model)
    {
        _stateManager = stateManager;
        _model = model;
    }

    public async Task<string> HandleMessageAsync(string conversationId, string userMessage)
    {
        // Get conversation state
        var conversationState = _stateManager.GetOrCreateConversation(conversationId);

        // Add user message to conversation history
        conversationState.Messages.Add(new ChatMessage
        {
            Role = "user",
            Content = userMessage
        });

        // Create a copy of messages for the prompt (to avoid modification)
        var messagesCopy = conversationState.Messages.ToList();

        // Create prompt with conversation history
        var prompt = new ChatPrompt(
            systemMessage: "You are a helpful assistant that remembers our conversation.",
            messages: messagesCopy
        );

        // Generate response
        var response = await _model.CompletePromptAsync(context, memory, functions, tokenizer, template);

        // Add assistant response to conversation history
        if (response.Message?.Content != null)
        {
            conversationState.Messages.Add(new ChatMessage
            {
                Role = "assistant",
                Content = response.Message.Content
            });

            // Save updated state
            _stateManager.SaveConversation(conversationState);

            return response.Message.Content;
        }

        return "I'm sorry, I couldn't generate a response.";
    }
}
```

![Stateful Chat Example](/screenshots/stateful-chat-example.png)
