# Migration

_**Navigation**_
- [**00.OVERVIEW**](./README.md)
- [01.JS](./JS.md)
- [02.DOTNET](./DOTNET.md)
___

### Why you should migrate to the Teams AI library

Is your Teams App currently build using the [BotFramework (BF) SDK](https://github.com/microsoft/botframework-sdk)? If so you should migrate it to the Teams AI library.

Here are a few reasons why:

1. Take advantage of the advanced AI system to build complex LLM-powered Teams applications. 
2. User authentication is built right into the library, simplifying the set up process.
3. The library builds on top of fundamental BF SDK tools & concepts, so your existing knowledge is transferrable. 
4. The library will continue to support latest tools & APIs in the LLM space.

### Difference between the Teams AI library and BF SDK

This library provides the `Application` object which replaces the traditional `ActivityHandler` object. It supports a simpler fluent style of authoring bots versus the inheritance based approach used by the `ActivityHandler` class. The `Application` object has built-in support for calling into the library's AI system which can be used to create bots that leverage Large Language Models (LLM) and other AI capabilities. It also has built-in support for configuring user authentication to access user data from third-party services.

### Guides

Here are the guides on how to migrate from the BotFramework SDK:

1. [JS Migration](JS.md)
2. [C# Migration](DOTNET.md)
