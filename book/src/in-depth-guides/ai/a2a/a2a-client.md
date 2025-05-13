# A2A Client

## What is an A2A Client?

An A2A client is an agent or application that can proactively send tasks to A2A servers and interact with them using the A2A protocol.

## Using AgentManager to Call A2A Servers

You can use the `AgentManager` to register and send tasks to different A2A servers:

```ts
{{ #include ../../../../generated-snippets/ts/client-example.snippet.a2a-client-directly-use-agent-manager-example.ts }}
```

## Using A2AClientPlugin with ChatPrompt

A2A is most effective when used with an LLM. The `A2AClientPlugin` can be added to your chat prompt to allow interaction with A2A agents. Once added, the plugin will automatically configure the system prompt and tool calls to determine if the a2a server is needed for a particular task, and if so, it will do the work of orchestrating the call to the A2A server.

```ts
{{ #include ../../../../generated-snippets/ts/client-example.snippet.a2a-client-use-with-chat-prompt-example.ts }}
```
```ts
{{ #include ../../../../generated-snippets/ts/client-example.snippet.a2a-client-use-with-chat-prompt-example-send.ts }}
```



## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant ChatPrompt
    participant A2APlugin
    participant A2AManager
    participant A2AAgentClient
    participant SubPrompt
    participant LLM
    participant TargetAgent

    alt config
        User->>ChatPrompt: "use" with A2A server details
        ChatPrompt->>A2APlugin: configure usable a2a server
        A2APlugin->>A2AManager: register new potential client
    end
    alt send
        User->>ChatPrompt: Send initial message
        ChatPrompt->>A2APlugin: configure system prompt
        A2APlugin->>A2AManager: get agent cards
        A2AManager->>A2AAgentClient: for each get agent card
        A2AAgentClient-->>A2AManager: agent card
        A2AManager-->>A2APlugin: all agent cards
        A2APlugin-->>ChatPrompt: updated system prompt
        ChatPrompt->>A2APlugin: configure tool-calls (onBuildFunctions)
        A2APlugin-->>ChatPrompt: Configured tool calls
        ChatPrompt->>LLM: send-message
        LLM-->>ChatPrompt: Call A2A TargetAgent
        ChatPrompt->>A2APlugin: Handler for calling A2A TargetAgent
        A2APlugin->>A2AManager: Call TargetAgent with message
        A2AManager->>A2AAgentClient: Call TargetAgent with message
        TargetAgent-->>A2AAgentClient: Return task (e.g., completed, input-required)
        A2AAgentClient->>A2AManager: Result task
        A2AManager->>A2APlugin: Result task
        A2APlugin->>ChatPrompt: Result task
        ChatPrompt-->>User: Respond with final result or follow-up
    end
```

## Notes

-   This package and the A2A protocol are experimental.
-   Ensure you handle errors and edge cases when interacting with remote agents.

## Further Reading

-   [A2A Protocol](https://google.github.io/A2A)
