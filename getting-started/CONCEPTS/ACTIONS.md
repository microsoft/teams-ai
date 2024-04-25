# Actions

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [Action Planner](./ACTION-PLANNER.md)
- [**Actions**](./ACTIONS.md)
- [AI System](./AI-SYSTEM.md)
- [Application class](./APPLICATION.md)
- [Augmentations](./AUGMENTATIONS.md)
- [Data Sources](./DATA-SOURCES.md)
- [Moderator](./MODERATOR.md)
- [Planner](./PLANNER.md)
- [Powered by AI](./POWERED-BY-AI.md)
- [Prompts](./PROMPTS.md)
- [Turns](./TURNS.md)
- [User Authentication](./USER-AUTH.md)

---

An action is an atomic function that is registered to the AI System. It is a fundamental building block of a plan. Actions are used to perform tasks such as creating a list, adding items to a list, or sending a message to the user. Actions are executed in the order they are defined in the plan.

Here's an example of what an action creating a new list would look like in code. Call this action `createList`:

### C#

[List Bot sample](https://github.com/microsoft/teams-ai/blob/a20f8715d3fe81e11c330853e3930e22abe298af/dotnet/samples/04.ai.d.chainedActions.listBot/ListBotActions.cs#L15)

```C#
[Action("createList")]
public bool CreateList([ActionTurnState] ListState turnState, [ActionParameters] Dictionary<string, object> parameters)
{
    ArgumentNullException.ThrowIfNull(turnState);
    ArgumentNullException.ThrowIfNull(parameters);

    string listName = GetParameterString(parameters, "list");

    EnsureListExists(turnState, listName);

  // Continues execution of next command in the plan.
    return "";
}
```

> Adding the `Action` attribute marks the method as an action. To register it to the AI System you have pass the instance object containing this method to the `AI.ImportActions(instance)` method. Alternatively, you can use the `AI.RegisterAction(name, handler)` to register a single action.

### JS

[List Bot sample](https://github.com/microsoft/teams-ai/blob/0fca2ed09d327ecdc682f2b15eb342a552733f5e/js/samples/04.ai.d.chainedActions.listBot/src/index.ts#L153)

```typescript
app.ai.action("createList", async (context: TurnContext, state: ApplicationTurnState, parameters: ListAndItems) => {
  // Ex. create a list with name "Grocery Shopping".
  ensureListExists(state, parameters.list);

  // Continues exectuion of next command in the plan.

  await app.ai.doAction(context, state, "addItems", parameters);
  return `list created and items added. think about your next action`;
});
```

To 'chain' actions together programmatically, the `doAction` method is used to call the next action. This is a common pattern in the AI System.

````

### Python

```python
@app.ai.action("createList")
async def create_list(context: ActionTurnContext, state: AppTurnState):
  ensure_list_exists(state, context.data["list"])
  # Continues exectuion of next command in the plan.
  return ""
````

> The `action` method registers the action named `createList` with corresponding callback function.

## Default Actions

The user can register custom actions or override default actions in the system. Below is a list of default actions present:

| Action                | Called when                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `___UnknownAction___` | An unknown action is predicted by the planner.                                                                                                                                                    |
| `___FlaggedInput___`  | The input is flagged by the moderator.                                                                                                                                                            |
| `___FlaggedOutput___` | The output is flagged by the moderator.                                                                                                                                                           |
| `___HttpError___`     | The planner encounters an HTTP response with status code >= `400`                                                                                                                                 |
| `__TooManySteps__`    | The planner task either executed too many steps or timed out.                                                                                                                                     |
| `___PlanReady___`     | The plan has been predicted by the planner and it has passed moderation. This can be overriden to mutate the plan before execution.                                                               |
| `___DO___`            | The AI system is executing a plan with the DO command. Overriding this action will change how _all_ DO commands are handled.                                                                      |
| `___SAY___`           | The AI system is executing a plan with the SAY command. Overriding this action will change how _all_ SAY commands are handled. By default this will send the `response` message back to the user. |

> Detailed description of each action can be found in the codebase.

Note that `___DO___` and `___SAY___`, despite being called commands, are actually specialized actions. This means that a plan is really a sequence of actions.

## Action handlers

An action handler is a callback function that is called when an action is triggered. The action handler is responsible for running code as a response to the calling of the action. The return value of the action handler is a string.

### Action handler return behavior

- If the result is a non-empty string, that string is included as the output of the action to the plan. The last output can be accessed in the next triggered action via the state object: `state.temp.lastOutput`.
- If the action handler returns `AI.StopCommandName`, the `run` method will terminate execution.
- If the result is an empty string and there is a list of predicted commands, the next command in the plan is executed.
- In sequence augmentation, the returned string is appended to the prompt at runtime (see Sequence [Augmentations](./AUGMENTATIONS.md)). This is then used to generate the plan object using defined actions.
- In monologue augmentation, the returned string is used as inner monologue to perform chain-of-thought reasoning by appending instructions to the prompt during runtime (see Monologue [Augmentation](./AUGMENTATIONS.md)). This is for predicing the next action to execute.

---

## Return to other major section topics:

- [**CONCEPTS**](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [OTHER](../OTHER/README.md)
