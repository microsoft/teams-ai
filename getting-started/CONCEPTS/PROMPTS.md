# Prompts

<small>**Navigation**</small>

- [00.OVERVIEW](./README.md)
- [Action Planner](./ACTION-PLANNER.md)
- [Actions](./ACTIONS.md)
- [AI System](./AI-SYSTEM.md)
- [Application class](./APPLICATION.md)
- [Augmentations](./AUGMENTATIONS.md)
- [Data Sources](./DATA-SOURCES.md)
- [Moderator](./MODERATOR.md)
- [Planner](./PLANNER.md)
- [Powered by AI](./POWERED-BY-AI.md)
- [**Prompts**](./PROMPTS.md)
- [Turns](./TURNS.md)
- [User Authentication](./USER-AUTH.md)

---

Prompt management plays a crucial role in communicating and directing the behavior of Large Language Models (LLMs) AI.
They serve as inputs or queries that users can provide to elicit specific responses from a model.

Here's a prompt that asks the LLM for name suggestions:

_Input:_

```
Give me 3 name suggestions for my pet golden retriever.
```

_Response:_

```
Some possible name suggestions for a pet golden retriever are:

- Bailey
- Sunny
- Cooper
```

# Prompt Template

Prompt templates are a simple and powerful way to
define and compose AI functions **using plain text**.
You can use it to create natural language prompts, generate responses, extract
information, **invoke other prompts,** or perform any other task that can be
expressed with text.

The language supports two basic features that allow you to include
variables and call functions.

**Simple Example:**

Here's an example of a prompt template:

```
Give me 3 name suggestions for my pet {{ $petName }}.
```

`$petName` is a variable that is populated on runtime when the template is rendered.

## Prompt Template Language

You don't need to write any code or import any external libraries, just use the
double curly braces {{...}} to embed expressions in your prompts.
Teams AI will parse your template and execute the logic behind it.
This way, you can easily integrate AI into your apps with minimal effort and
maximum flexibility.

### Variables

To include a variable value in your text, use the `{{$variableName}}` syntax. For example, if you have a variable called name that holds the user's name, you can write:

`Hello {{$name}}, nice to meet you!`

This will produce a greeting with the user's name.

Spaces are ignored, so if you find it more readable, you can also write:

`Hello {{ $name }}, nice to meet you!`

Here's how to define variables in code:

**C#**

In an _action_ or _route handler_ where the turn state object is available:

```cs
state.Temp.Post = "Lorem Ipsum..."
```

The usage in the prompt:

```
This is the user's post: {{ $post }}
```

> Note: The `turnState.Temp.Post = ...` updates a dictionary with the `post` key under the hood from the [AI Message Extension sample](https://github.com/microsoft/teams-ai/blob/a20f8715d3fe81e11c330853e3930e22abe298af/dotnet/samples/04.ai.b.messageExtensions.gptME/ActivityHandlers.cs#L156).

**Javascript**

```typescript
app.beforeTurn((context, state) => {
  state.temp.post = "Lorem Ipsum...";
});
```

**Python**

```python
@app.before_turn
async def before_turn(context: TurnContext, state: AppTurnState):
    state.temp.post = "Lorem Ipsum..."
    return True
```

The usage in the prompt:

```
This is the user's post: {{ $post }}
```

You can simply add to the `state.temp` object, and it will be accessible from the prompt template on runtime. Note that the safest place to do that would be in the `beforeTurn` activity because it will execute before any activity handler or action.

**Default Variables**

The following are variables accessible in the prompt template without having to manually configure them. These are pre-defined in the turn state and populated by the library. Users can override them by changing it in the turn state.

| Variable name | Description                                    |
| ------------- | ---------------------------------------------- |
| `input`       | Input passed from the user to the AI Library.  |
| `lastOutput`  | Output returned from the last executed action. |

### Function calls

To call an external function and embed the result in your text, use the `{{ functionName }}` syntax. For example, if you have a function called `diceRoll` that returns a random number between 1 and 6, you can write:

`The dice roll has landed on: {{ diceRoll }}`

**C#**

In the `Application` class,

```cs
prompts.AddFunction("diceRoll", async (context, memory, functions, tokenizer, args) =>
{
    int diceRoll = // random number between 1 and 6
    return diceRoll;
});
```

**Javascript**

```typescript
prompts.addFunction('diceRoll', async (context, state, functions, tokenizer, args) => {
    let diceRoll = // random number between 1 and 6
    return diceRoll;
});
```

**Python**

```python
@prompts.function("diceRoll")
async def dice_roll(
    context: TurnContext,
    state: MemoryBase,
    functions: PromptFunctions,
    tokenizer: Tokenizer,
    args: List[str]
):
    dice_roll = # random number between 1 and 6
    return dice_roll
```

# Creating Prompt Templates

Each prompt template is a folder with two files, `skprompt.txt` and `config.json`. The folder name is the prompt template's name which can be referred to in your code. The `skprompt.txt` file contains the prompt's text, which can contain natural language or prompt template syntax as defined in the previous section. The `config.json` file specifies the prompt completion configuration.

Here's an example of a prompt template from the [Twenty Questions](https://github.com/microsoft/teams-ai/blob/c5ec11842b808e48cd214b3cb52da84e5811da33/js/samples/04.e.twentyQuestions) sample.

_skprompt.txt_

```
You are the AI in a game of 20 questions.
The goal of the game is for the Human to guess a secret within 20 questions.
The AI should answer questions about the secret.
The AI should assume that every message from the Human is a question about the secret.

GuessCount: {{$conversation.guessCount}}
RemainingGuesses: {{$conversation.remainingGuesses}}
Secret: {{$conversation.secretWord}}

Answer the human's question but do not mention the secret word.
```

_config.json_

```json
{
  "schema": 1.1,
  "description": "A bot that plays a game of 20 questions",
  "type": "completion",
  "completion": {
    "completion_type": "chat",
    "include_history": false,
    "include_input": true,
    "max_input_tokens": 2000,
    "max_tokens": 256,
    "temperature": 0.7,
    "top_p": 0.0,
    "presence_penalty": 0.6,
    "frequency_penalty": 0.0
  }
}
```

> Note that the configuration properties in the file do not include all the possible configurations. To learn more about the description of each configuration and all the supported configurations see the [`PromptTemplatConfig`](https://github.com/microsoft/teams-ai/blob/2d43f5ca5b3bf27844f760663641741cae4a3243/js/packages/teams-ai/src/prompts/PromptTemplate.ts#L46C18-L46C39) Typescript interface.

These files can be found under the `src/prompts/chat/` folder. So, this prompt template's name is `chat`. Then, to plug these files in the Action Planner, the prompt manager has to be created with the folder path specified and then passed into the Action Planner constructor:

**C#**

```cs
PromptManager prompts = new PromptManager(new PromptManagerOptions(){
    PromptFolder = "./prompts"
});
```

The file path is relative to the source of file in which the `PromptManager` is created. In this case the `Program.cs` was in the same folder as the `prompts` folder.

**Javascript**

```ts
const prompts = new PromptManager({
  promptsFolder: path.join(__dirname, "../src/prompts")
});
```

**Python**

```python
prompts = PromptManager(PromptManagerOptions(
    prompts_folder=f"{os.getcwd()}/src/prompts"
))
```

---

## Return to other major section topics:

- [**CONCEPTS**](../CONCEPTS/README.md)
- [MIGRATION](../MIGRATION/README.md)
- [QUICKSTART](../QUICKSTART.md)
- [SAMPLES](../SAMPLES.md)
- [OTHER](../OTHER/README.md)
