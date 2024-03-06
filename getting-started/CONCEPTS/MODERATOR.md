# Moderator

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [Action Planner](./ACTION-PLANNER.md)
- [Actions](./ACTIONS.md)
- [AI System](./AI-SYSTEM.md)
- [Application class](./APPLICATION.md)
- [Augmentations](./AUGMENTATIONS.md)
- [Data Sources](./DATA-SOURCES.md)
- [**Moderator**](./MODERATOR.md)
- [Planner](./PLANNER.md)
- [Prompts](./PROMPTS.md)
- [Turns](./TURNS.md)
- [User Authentication](./USER-AUTH.md)

---

The `Moderator` is responsible for reviewing the input prompt and approving the AI generated plans. It is configured when orchestrating the `Application` class.

The AI system is such that developers can create their own moderator class by simply implementing the moderator interface. The library has a few native moderators that can be used out of the box:

| Name                                                           | Description                                                                                                            |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [OpenAIModerator](#openai-moderator)                           | Wrapper around OpenAI's [Moderation API](https://platform.openai.com/docs/api-reference/moderations).                  |
| [AzureContentSafetyModerator](#azure-content-safety-moderator) | Wrapper around [Azure Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview) API |

## OpenAI Moderator

Here's an example of configuring the `OpenAIModerator`:

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
OpenAIModeratorOptions moderatorOptions = new(config.OpenAI.ApiKey, ModerationType.Both);
IModerator<TurnState> moderator = new OpenAIModerator<TurnState>(moderatorOptions);

AIOptions<TurnState> aIOptions = new(planner)
{
    Moderator = moderator
};

var app = new ApplicationBuilder<TurnState>()
.WithStorage(storage)
.WithAIOptions(aIOptions)
.Build();
```

> This snippet is taken from the [Twenty Questions bot] sample.
> Note for C# application, the moderator should be registered to the Web app's service collection as a singleton.

## Azure Content Safety Moderator

Here's an example of configuring the `AzureContentSafetyModerator`:

**JS**

```js
const moderator = new AzureContentSafetyModerator({
  apiKey: process.env.AZURE_CONTENT_SAFETY_KEY,
  endpoint: process.env.AZURE_CONTENT_SAFETY_ENDPOINT,
  apiVersion: "2023-04-30-preview",
  moderate: "both"
});
```

**C#**

```cs
AzureContentSafetyModeratorOptions moderatorOptions = new(config.Azure.ContentSafetyApiKey, config.Azure.ContentSafetyEndpoint, ModerationType.Both);
IModerator<TurnState> moderator = new AzureContentSafetyModerator<TurnState>(moderatorOptions);
```

---

## Return to other major section topics:

- [**CONCEPTS**](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [OTHER](../OTHER/README.md)
