# Action Planner

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [**Action Planner**](./ACTION-PLANNER.md)
- [Actions](./ACTIONS.md)
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

The Action Planner is a powerful planner that uses an LLM to generate plans. It can trigger parameterized actions and send text-based responses to the user. It supports the following advanced features:

### [Prompts](./PROMPTS.md)

The Action Planner has a built-in prompt management system that supports creating prompt templates as folders in the file system. A prompt template is the prompt text along with all the configurations for completion with the LLM model. Dynamic prompts also support template variables and functions.

#### [Data Sources](./DATA-SOURCES.md)

Use data sources to augment prompts even further and facilitate better responses.

### [Augmentations](./AUGMENTATIONS.md)

Augmentations virtually eliminate the need for prompt engineering. Prompts
can be configured to use a named augmentation which will be automatically appended to the outgoing
prompt. Augmentations let the developer specify whether they want to support multi-step plans (sequence),
or create an AutoGPT style agent (monologue).

### Validations

Validators are used to validate the response returned by the LLM and can guarantee
that the parameters passed to an action match a supplied schema. The validator used is automatically
selected based on the augmentation being used. Validators also prevent hallucinated action names,
making it impossible for the LLM to trigger an action that doesn't exist.

### Repair

The Action Planner will automatically attempt to repair invalid responses returned by the
LLM using a feedback loop. When a validation fails, the ActionPlanner sends the error back to the
model, along with an instruction asking it to fix its mistake. This feedback technique leads to a
dramatic reduction in the number of invalid responses returned by the model.
