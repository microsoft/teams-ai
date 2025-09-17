---
sidebar_position: 5
summary: Overview of AI components in C# Teams AI, including Prompts for orchestration and Models for LLM interfaces.
---

# 🤖 AI

The AI components in this library are designed to make it easier to build C# applications with LLMs.
The `Microsoft.Teams.AI` library has two main components:

## 📦 Prompts

A `Prompt` is the component that orchestrates everything, it handles state management,
function definitions, and invokes the model/template when needed. This layer abstracts many of
the complexities of the Models to provide a common interface.

## 🧠 Models

A `Model` is the component that interfaces with the LLM, being given some `input` and returning the `output`.
This layer deals with any of the nuances of the particular Models being used.

It is in the model implementation that the individual LLM features (i.e. streaming/tools etc.)
are made compatible with the more general features of the `Microsoft.Teams.AI` library.

:::note
You are not restricted to use the `Microsoft.Teams.AI` library to build your Teams Agent applications. You can use models directly if you choose. This library is there to simplify the interactions with the models and Teams.
:::