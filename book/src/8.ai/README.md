# 🤖 AI

Tools that make it easier to integrate apps with LLM's and enabling multi-agent scenarios.
The `@microsoft/teams.ai` package has three main components:

## 🧠 Models

A `Model` is the component that interfaces with the LLM,
being given some `input` and returning the `output`.

It is in the model implementation that the individual LLM features (ie Streaming/Tools etc)
are made compatible with the more general features of the `@microsoft/teams.ai` package.

## 📄 Templates

A `Template` is the component that allows the `instructions` or "System Prompt" to be
parsed. Via this abstraction developer can bring their own templating language like
`handlebars` if they want.

## 📦 Prompts

A `Prompt` is the component that orchestrates everything, it handles state management,
function definitions, and invokes the model/template when needed.

> [**ℹ️ Note**]
> A prompt can have one model and one template. The type of model that can be provided to a
> prompt must match that of the prompt.

## 💬 🔈 📷 Multi Media

`Prompts` and `Models` are typically separated into different media types, but some
support multiple media types at once.

The model given to a prompt must have one or more matching media types, this is because
the media type of a model affects how a prompt will interface with it, and the media type of
a prompt affects the features it supports **and** how you can interface/prompt it.
