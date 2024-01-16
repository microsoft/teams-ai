# Action Planner

The Action Planner is a powerful planner that uses a LLM to generate plans. It can trigger parameterized actions and send text based responses to the user. It supports the following advanced features:

[**Prompt Management**](./PROMPTS.md)
The Action Planner has a built-in prompt management system that supports creating prompt templates as folders in the file system. A prompt template is the prompt text along with all the configurations for completion with the LLM model. Dynamic prompts are also supported with template variables and functions.

[**Augmentations**](./AUGMENTATIONS.md)
Augmentations virtually eliminate the need for prompt engineering. Prompts
can be configured to use a named augmentation which will be automatically appended to the outgoing
prompt. Augmentations let the developer specify whether they want to support multi-step plans (sequence),
or create an AutoGPT style agent (monologue).

**Validations** 
Validators are used to validate the response returned by the LLM and can guarantee
that the parameters passed to an action mach a supplied schema. The validator used is automatically
selected based on the augmentation being used. Validators also prevent hallucinated action names
making it impossible for the LLM to trigger an action that doesn't exist.

**Repair** 
The Action Planner will automatically attempt to repair invalid responses returned by the
LLM using a feedback loop. When a validation fails, the ActionPlanner sends the error back to the
model, along with an instruction asking it to fix its mistake. This feedback technique leads to a
dramatic reduction in the number of invalid responses returned by the model.