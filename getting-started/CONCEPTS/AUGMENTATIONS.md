# Augmentations

Augmentations virtually eliminate the need for prompt engineering. Prompts
can be configured to use a named augmentation which will be automatically appended to the outgoing
prompt. Augmentations let the developer specify whether they want to support multi-step plans (sequence),
or create an AutoGPT style agent (monologue).

It is recommended to read the [AI System](./AI-SYSTEM.md) and [Action Planner](./ACTION-PLANNER.md) guides if you are not familiar with plans and actions.

## Sequence Augmentation

This augmentation allows the model to return a sequence of actions to perform. It does this by appending instructions to the prompt text in runtime. These instructions guide the model to generate a plan object that uses actions defined in the `actions.json` file from the prompt template folder. 

Here's an example of the `actions.json` file from the [Light Bot](https://github.com/microsoft/teams-ai/blob/77339da9e3e03bfd7f629fc796cfebdcd2891afb/js/samples/04.ai.c.actionMapping.lightBot/src/prompts/sequence/actions.json) sample:

```js
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
            "required": [
                "time"
            ]
        }
    }
]
```

It defines three actions, `LightsOn`, `LightsOff` and `Pause`. The `Pause` action requires the `time` parameter, while the other two doesn't.

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

The first section lists the actions in yaml structure. The second sections tells the model to return a plan object of the following schema.

### Configuring your prompt

To use sequence augmentation in your prompt there are two steps.

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
    },
]
```

The learn more about the action object schema see the corresponding typescript interface [ChatCompletionAction](https://github.com/microsoft/teams-ai/blob/0fca2ed09d327ecdc682f2b15eb342a552733f5e/js/packages/teams-ai/src/models/ChatCompletionAction.ts#L14).




## Monologue Augmentation