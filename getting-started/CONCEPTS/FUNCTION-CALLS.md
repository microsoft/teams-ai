# Function Calls

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [Action Planner](./ACTION-PLANNER.md)
- [Actions](./ACTIONS.md)
- [AI System](./AI-SYSTEM.md)
- [Application class](./APPLICATION.md)
- [Augmentations](./AUGMENTATIONS.md)
- [Data Sources](./DATA-SOURCES.md)
- [**Function Calls**](./FUNCTION-CALLS.md)
- [Moderator](./MODERATOR.md)
- [Planner](./PLANNER.md)
- [Powered by AI](./POWERED-BY-AI.md)
- [Prompts](./PROMPTS.md)
- [Turns](./TURNS.md)
- [User Authentication](./USER-AUTH.md)

---

Function calls allows models to directly connect to external tools. This unlocks the power of AI to establish deeper integrations between applications and achieve greater capabilities. This consists of performing computations, data retrieval, richer workflows, dynamic user interactions, and more.

NOTE: We currently do not support Structured Outputs.

## Configuration
To use function calling with the Chat Completions API:

1. Instantiate the `ToolsAugmentation` class, a server-side augmention. 

    ### JS

    ```js
    const planner = new ActionPlanner({
        model,
        prompts,
        defaultPrompt: 'tools'
    });
    ```

    ### Python

    ```python

    planner = ActionPlanner(ActionPlannerOptions(model=model, prompts=prompts, default_prompt="tools"))

    ```

2. Specify "tools" in your `config.json`. 

    ```diff
    {
        "schema": 1.1,
        "description": "",
        "type": "",
        "completion": {
    +       "tool_choice": "auto",
    +       "parallel_tool_calls": true,
        },
    +    "augmentation": {
    +        "augmentation_type": "tools"
    +    }
    }
    ```

    Optionally, in your `config.json`, specify `tool_choice` (defaults to "auto"). This means the model can select which functions to call. Setting it to "required" will mandate the model to always call at least one function. You can also set it to a specific function using its definition, or to "none".

    Likewise, you may specify `parallel_tool_calls` (defaults to true). This will be more efficient as executing certain functions can take awhile. 


3. All function definitions live in the `actions.json` file in your prompts folder. 

    ```json
    [{
        "name": "CreateList",
        "description": "Creates a list"
    }]
    ```

4. Corresponding handlers are registered in your application class. 

    Each handler is a callback function that is called when a function is triggered. The function call handler is responsible for running code as a response to the calling of the function. 
    
    The return value must be a string, and is included as the output of the function call. Once all functions have been executed, these outputs are then returned to the model.

    ### JS

    ```typescript
    app.ai.action("createList", async (context: TurnContext, state: ApplicationTurnState, parameters: ListAndItems) => {
    // Ex. create a list with name "Grocery Shopping".
    ensureListExists(state, parameters.list);
    return `list created and items added. think about your next action`;
    });
    ```

    ### Python

    ```python
    @app.ai.action("createList")
    async def create_list(context: ActionTurnContext, state: AppTurnState):
    ensure_list_exists(state, context.data["list"])
    # Continues exectuion of next command in the plan.
    return ""
    ```` 


If the model requests to invoke any function(s), these are internally mapped to `DO` commands within a `Plan`, which are then invoked in our AI class' `run` function. These outputs are then returned to the model.


## Return to other major section topics:

- [**CONCEPTS**](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [OTHER](../OTHER/README.md)

