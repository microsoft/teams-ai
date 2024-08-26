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

Function calls allows models to directly connect to external tools. This unlocks the power of AI to establish deeper integrations between applications and achieve greater capabilities. This includes performing computations, behaving as an assistant, data retrieval, richer workflows, dynamic user interactions, and more.

To use function calling with the Chat Completions API:

1. Instantiate the `ToolsAugmentation` class, a server-side augmention. You will also need to specify "tools" in your `config.json`. 

2. All function definitions live in the `actions.json` file in your prompts folder. 

3. Corresponding handlers are registered in your application class.

4. Optionally, in your `config.json`, specify your `tool_choice` (based on OpenAI, this defaults to "auto"). This means the model can select which functions to call. Setting it to "required" will mandate the model to always call at least one function. You can also set it to a specific function using its definition, or to "none".

5. Optionally, in your `config.json`, specify `parallel_tool_calls` (based on OpenAI, defaults to "true"). This will be more efficient as executing certain functions can take a long time. 

If the model requests to invoke function(s), these are internally mapped to DO commands within a Plan, which are then invoked in our AI class' `run` function. These outputs are then returned to the model.

NOTE: We currently do not support Structured Outputs.


## Function Call Handler

A function call handler is a callback function that is called when a function is triggered. The function call handler is responsible for running code as a response to the calling of the function. These handlers live in your application class.

The return value must be a string, and is included as the output of the function call. Once all functions have been executed, these outputs are then returned to the model.

---

### JS

### Python

---

## Return to other major section topics:

- [**CONCEPTS**](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [OTHER](../OTHER/README.md)

