# Migration

<small>**Navigation**</small>

- [**00.OVERVIEW**](./README.md) - Overview of the Migration section
- [01.JS](./01.JS.md)
- [02.DOTNET](./02.DOTNET.md)
- [03.PYTHON](./03.PYTHON.md)

---

### Why you should migrate to the Teams AI library

Is your Teams App currently built using the [BotFramework (BF) SDK](https://github.com/microsoft/botframework-sdk)? If so you should migrate it to the Teams AI library.

Here are a few reasons why:

1. Take advantage of the advanced AI system to build complex LLM-powered Teams applications.
2. User authentication is built right into the library, simplifying the set up process.
3. The library builds on top of fundamental BF SDK tools & concepts, so your existing knowledge is transferrable.
4. The library will continue to support latest tools & APIs in the LLM space.

### Difference between the Teams AI library and BF SDK

This library provides the `Application` object which replaces the traditional `ActivityHandler` object. It supports a simpler fluent style of authoring bots versus the inheritance based approach used by the `ActivityHandler` class. The `Application` object has built-in support for calling into the library's AI system which can be used to create bots that leverage Large Language Models (LLM) and other AI capabilities. It also has built-in support for configuring user authentication to access user data from third-party services.

### Guides

Here are the guides on how to migrate from the BotFramework SDK:

1. [JS Migration](01.JS.md)
2. [C# Migration](02.DOTNET.md)
3. [Python Migration](03.PYTHON.md)

---

## Return to other major section topics:

- [CONCEPTS](../CONCEPTS/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [OTHER](../OTHER/README.md)
