# AI in Microsoft Teams: Twenty Qestions

Welcome to the 20 Questions Bot: The Ultimate Guessing Game! This developer sample application showcases the incredible capabilities of language models and the concept of user intent. Challenge your skills as the human player and try to guess a secret within 20 questions, while the AI-powered bot answers your queries about the secret. Experience firsthand how language models interpret user input and provide informative responses, creating an engaging and interactive gaming experience. Get ready to dive into the world of language models and explore the fascinating realm of user interaction and intent.
It shows following SDK capabilities:

<details open>
    <summary><h3>Bot scaffolding</h3></summary>
    Throughout the 'Program.cs' and 'GameBot.cs' files you'll see the scaffolding created to run a bot with AI features.
</details>
<details open>
    <summary><h3>Prompt engineering</h3></summary>
The 'Prompts/Hint/skprompt.txt' file has descriptive prompt engineering that, in plain language, instructs GPT how the bot should conduct itself at submit time. For example, in 'skprompt.txt':

#### skprompt.txt

```text
You are the AI in a game of 20 questions. 
The goal of the game is for the Human to guess a secret within 20 questions. 
The AI should answer questions about the secret.
The AI should assume that every message from the Human is a question about the secret.

GuessCount: {{$guessCount}}
RemainingGuesses: {{$remainingGuesses}}
Secret: {{$secretWord}}

Answer the humans question but do not mention the secret word.

Human: {{$input}}
AI: 
```

</details>

## Setting up the sample

1. Setup [prerequisites](../README.md) for using Teams Toolkit in Visual Studio.

1. Get this sample from GitHub. Clone or download the whole *TwentyQuestions* project.

1. In the project folder *TwentyQuestions/*, put the Microsoft.TeamAI package (*Microsoft.TeamsAI.\<version\>.nupkg*) under *LocalPkg/* folder.

## Local Debug (F5)

1. Set your OpenAI API Key to *appsettings.Development.json*.

    ```json
      "OpenAI": {
        "ApiKey": "<your-openai-api-key>"
      },
    ```

1. In the debug target dropdown menu, select "Dev Tunnels" > "Create A Tunnel..." (set authentication type to Public) or select an existing public dev tunnel.

1. Right-click your project and select "Teams Toolkit" > "Prepare Teams App Dependencies".

1. If prompted, sign in with a Microsoft 365 account for the Teams organization you want to install the app to.

1. Press F5, or select the debug target "Microsoft Teams (browser)" in Visual Studio.

1. In the launched browser, select the Add button to load the app in Teams.

1. In the chat bar, type and send any message (e.g. "let's start") to your app to start the game.

## Deploy to Azure

## Further reading

- [Teams Toolkit overview](https://aka.ms/vs-teams-toolkit-getting-started)
- [How Microsoft Teams bots work](https://learn.microsoft.com/azure/bot-service/bot-builder-basics-teams?view=azure-bot-service-4.0&tabs=csharp)