# 🔗 Chaining

By using multiple prompts and at least one `ChatPrompt` for orchestration,
you can chain your prompts together. This has many benefits, including:

## 🗃️ Isolation

By breaking your functionality into separate prompts, its easier to organize your
prompts logic into different categories or subtasks, leading to cleaner code that
should also be easier to test.

## ✅ Improved Accuracy

By breaking your functionality into separate prompts, you help the LLM
break large problems down into smaller more specific tasks. With the top prompt
acting as a router, it can choose to invoke child prompts when needed.

This limits what an single prompt must do, which is important since the more complexity
you add to a models prompt, the less accurate it becomes.

## 💬 🔈 📷 Multi Media

The orchestrator must be a `ChatPrompt` to support functions, but child prompts
can be of any type. This is useful because many models today do not support
multiple media types.

You can create a multi-media experience with any model via chaining.
