# Action

An action is an atomic function that is registered to the AI System. It is a fundamental building block of a plan.

Here's an example of how an action to create a new list would look like in code. Call this action `createList`:

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

  // Continues exectuion of next command in the plan.
    return "";
}
```

> Adding the `Action` attribute marks the method as an action. To register it to the AI System you have pass the instance object containing this method to the `AI.ImportActions(instance)` method. Alternatively you can use the `AI.RegisterAction(name, handler)` to register a single action.

### JS

[List Bot sample](https://github.com/microsoft/teams-ai/blob/0fca2ed09d327ecdc682f2b15eb342a552733f5e/js/samples/04.ai.d.chainedActions.listBot/src/index.ts#L153)
```typescript
app.ai.action("createList", async (context: TurnContext, state: ApplicationTurnState, parameters: ListAndItems) => {
  // Ex. create a list with name "Grocery Shopping".
  ensureListExists(state, parameters.list);

  // Continues exectuion of next command in the plan.
  return true;
});
```

> The `action` method registers the action named `createList` with corresponding callback function.


## Default Actions

The user can register custom actions or override default actions in the system. Below is a list of default actions present:

| Action                | Called when                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `___UnkownAction___`   | An unknown action is predicted by the planner.                                   |
| `___FlaggedInput___`  | The input is flagged by the moderator.                                            |
| `___FlaggedOutput___` | The output is flagged by the moderator.                                           |
| `___HttpError___`     | The planner encounters an HTTP response with status code >= `400`       |
| `__TooManySteps__` | The planner task either executed too many steps or timed out. |
| `___PlanReady___`     | The plan has been predicted by the planner and it has passed moderation. This can be overriden to mutate the plan before execution.           |
| `___DO___`            | The AI system is executing a plan with the DO command. Overriding this action will change how _all_ DO commands are handled.   |
| `___SAY___`           | The AI system is executing a plan wit the SAY command. Overriding this action will change how _all_ SAY commands are handled. By default this will send the `response` message back to the user. |

> Detailed description of each action can be found in the codebase.

Note that `___DO___` and `___SAY___`, despite being called commands, are actually specialized actions. This means that a plan is really a sequence of actions.
