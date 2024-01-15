## Moderator

The `Moderator` is responsible for reviewing the input prompt and approving the AI generated plans. It is configured when orchestrating the `Application` class. Here's an example of configuring the `OpenAIModerator`.

**JS**
```js
const moderator = new OpenAIModerator({
    apiKey: process.env.OPENAI_KEY!,
    moderate: 'both'
});

const app = new Application({
    storage,
    ai: {
        planner,
        moderator
    }
});
```

**C#**
```cs
OpenAIModeratorOptions moderatorOptions = new("api-key", ModerationType.Both);
IModerator<GameState> moderator = new OpenAIModerator<GameState>(moderatorOptions);

AIOptions<GameState> aIOptions = new(planner)
{
    Moderator = moderator
};

var app = new ApplicationBuilder<GameState>()
.WithStorage(storage)
.WithAIOptions(aIOptions)
.Build();
```
> Note for C# application, the moderator should be registered to the Web app's service collection as a singleton.

The AI system is such that developers can create their own moderator class by simply implementing the moderator interface. The library has a few native moderators that can be used out of the box:

| Name                        | Description                             |
|-----------------------------|-----------------------------------------|
| OpenAIModerator             | Wrapper around OpenAI's [Moderation API](https://platform.openai.com/docs/api-reference/moderations). |
| AzureContentSafetyModerator | Wrapper around [Azure Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview) API |