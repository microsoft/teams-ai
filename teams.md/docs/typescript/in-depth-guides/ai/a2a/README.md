---
summary: Overview of the experimental A2A (Agent-to-Agent) protocol for enabling programmatic communication between AI agents.
---

# A2A (Agent-to-Agent) Protocol

:::caution
This package is experimental and the A2A protocol is still in early development. Use with caution in production environments.
:::

[What is A2A?](https://google.github.io/A2A)

A2A (Agent-to-Agent) is a protocol designed to enable agents to communicate and collaborate programmatically. This package allows you to integrate the A2A protocol into your Teams app, making your agent accessible to other A2A clients and enabling your app to interact with other A2A servers.

Install the package:

```bash
npm install @microsoft/teams.a2a
```

## What does this package do?

-   Enables your Teams agent to act as an A2A server, exposing its capabilities to other agents.
-   Allows your Teams app to proactively reach out to other A2A servers as a client.

## High-level Architecture

### A2A Server
```mermaid
flowchart RL
    A_S[TeamsApp]
    B[A2APlugin]
    D[External A2A Client]


    D -- "task/send" message --> A_S
    subgraph A2A Server
        direction LR
        A_S --> B
    end
    B -- AgentCard --> D
    B -- "task/send" response --> D
```

### A2A Client

```mermaid
flowchart LR
    A_C[TeamsApp]
    C[A2AClientPlugin]
    E[External A2A Server]
    U[Teams User]

    U --> A_C
    subgraph A2A Client
        direction LR
        A_C -- message --> C
        C -- response from server --> A_C
    end
    C -- message task/send --> E
    E -- AgentCard --> C
    E -- task/send response --> C
```