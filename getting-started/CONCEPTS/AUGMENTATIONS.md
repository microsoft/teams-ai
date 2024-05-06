# Augmentations

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [Action Planner](./ACTION-PLANNER.md)
- [Actions](./ACTIONS.md)
- [AI System](./AI-SYSTEM.md)
- [Application class](./APPLICATION.md)
- [**Augmentations**](./AUGMENTATIONS.md)
- [Data Sources](./DATA-SOURCES.md)
- [Moderator](./MODERATOR.md)
- [Planner](./PLANNER.md)
- [Powered by AI](./POWERED-BY-AI.md)
- [Prompts](./PROMPTS.md)
- [Turns](./TURNS.md)
- [User Authentication](./USER-AUTH.md)

---

Augmentations virtually eliminate the need for prompt engineering. Prompts
can be configured to use a named augmentation which will be automatically appended to the outgoing
prompt. Augmentations let the developer specify whether they want to support multi-step plans (sequence),
or create an AutoGPT style agent (monologue).

It is recommended to read the [AI System](./AI-SYSTEM.md) and [Action Planner](./ACTION-PLANNER.md) guides if you are not familiar with plans and actions.

## Sequence Augmentation

This augmentation allows the model to return a sequence of actions to perform. It does this by appending instructions to the prompt text during runtime. These instructions guide the model to generate a plan object that uses actions defined in the `actions.json` file from the prompt template folder.

Here's an example of the `actions.json` file from the [Light Bot](https://github.com/microsoft/teams-ai/blob/77339da9e3e03bfd7f629fc796cfebdcd2891afb/js/samples/04.ai.c.actionMapping.lightBot/src/prompts/sequence/actions.json) sample:

```json
[
  {
    "name": "LightsOn",
    "description": "Turns on the lights"
  },
  {
    "name": "LightsOff",
    "description": "Turns off the lights"
  },
  {
    "name": "Pause",
    "description": "Delays for a period of time",
    "parameters": {
      "type": "object",
      "properties": {
        "time": {
          "type": "number",
          "description": "The amount of time to delay in milliseconds"
        }
      },
      "required": ["time"]
    }
  }
]
```

It defines three actions, `LightsOn`, `LightsOff` and `Pause`. The `Pause` action requires the `time` parameter, while the other two don't.

These actions are then appended to the prompt text during runtime. This is text added to end of the prompt text:

```txt
actions:
  LightsOn:
      description: Turns on the lights
  LightsOff:
      description: Turns off the lights
  Pause:
      description: Delays for a period of time
      parameters:
        time:
          type: number
          description: The amount of time to delay in milliseconds

Use the actions above to create a plan in the following JSON format:

{
  "type": "plan",
  "commands": [
    {
      "type": "DO",
      "action": "<name>",
      "parameters": {
        "<name>": "<value>"
      }
    },
    {
      "type": "SAY",
      "response": "<response>"
    }
  ]
}
```

> Note: When the prompt is rendered, the above text is compressed to reduce token usage.

The first section lists the actions in yaml structure. The second section tells the model to return a plan object of the following schema.

### Configuring your prompt

There are two steps to use sequence augmentation in your prompt:

1. Update the prompt's `config.json` by adding the `augmentation` property.

```diff
{
    "schema": 1.1,
    "description": "",
    "type": "",
    "completion": {},
+    "augmentation": {
+        "augmentation_type": "sequence"
+    }
}
```

2. Create an `actions.json` file in the prompt folder with a list of actions. For example:

```json
[
  {
    "name": "LightsOn",
    "description": "Turns on the lights"
  },
  {
    "name": "LightsOff",
    "description": "Turns off the lights"
  }
]
```

To learn more about the action object schema see the corresponding typescript interface [ChatCompletionAction](https://github.com/microsoft/teams-ai/blob/0fca2ed09d327ecdc682f2b15eb342a552733f5e/js/packages/teams-ai/src/models/ChatCompletionAction.ts#L14).

## Monologue Augmentation

This augmentation adds support for an inner monologue to the prompt. The monologue helps the LLM perform chain-of-thought reasoning across multiple turns of conversation. It does this by appending instructions to the prompt text during runtime. It tells the model to explicitly show it's thought, reasoning and plan in response to the user's message, then predict the next action to execute. If looping is configured, then the predicted action can guide the model to predict the next action by returning the instruction as a string in the action handler callback. The loop will terminate as soon as the model predicts a _SAY_ action, which sends the response back to the user.

Using the `actions.json` example from above, the instructions appended to the prompt look like the text below.

These actions are then used and appended to the prompt text in runtime. This is text added to end of the prompt text:

```txt
actions:
  LightsOn:
      description: Turns on the lights
  LightsOff:
      description: Turns off the lights
  Pause:
      description: Delays for a period of time
      parameters:
        time:
          type: number
          description: The amount of time to delay in milliseconds

Return a JSON object with your thoughts and the next action to perform.
Only respond with the JSON format below and base your plan on the actions above.
If you're not sure what to do, you can always say something by returning a SAY action.
If you're told your JSON response has errors, do your best to fix them.

Response Format:

{
  "thoughts": {
    "thought": "<your current thought>",
    "reasoning": "<self reflect on why you made this decision>",
    "plan": "- short bulleted\\n- list that conveys\\n- long-term plan"
  },
  "action": {
    "name": "<action name>",
    "parameters": {
      "<name>": "<value>"
    }
  }
}
```

> Note: When the prompt is rendered, the above text is compressed to reduce token usage.

The first section lists the actions in yaml structure. The second section tells the model to return a plan object of the following schema.

### Configuring your prompt

To use monologue augmentation in your prompt there are two steps.

1. Update the prompt's `config.json` by adding the `augmentation` property.

```diff
{
    "schema": 1.1,
    "description": "",
    "type": "",
    "completion": {},
+    "augmentation": {
+        "augmentation_type": "monologue"
+    }
}
```

2. Create an `actions.json` file in the prompt folder with a list of actions. For example:

```json
[
  {
    "name": "LightsOn",
    "description": "Turns on the lights"
  },
  {
    "name": "LightsOff",
    "description": "Turns off the lights"
  }
]
```

---

## Return to other major section topics:

- [**CONCEPTS**](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [OTHER](../OTHER/README.md)
