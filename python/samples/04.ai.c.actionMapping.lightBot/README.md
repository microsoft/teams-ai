# <img src="../../../assets/icon.png" height="10%" width="10%" /> Light Bot

A conversational bot for Microsoft Teams, designed as an AI assistant. The bot connects to a third-party service to turn a light on or off.

This sample illustrates more complex conversational bot behavior in Microsoft Teams. The bot is built to allow GPT to facilitate the conversation on its behalf as well as manually defined responses, and maps user intents to user defined actions.

- [Concepts](#concepts)
- [Prerequisites](#prerequisites)
- [Run](#run)
- [Development](#development)

## Concepts

- Listening/Sending Activities
- Error Handling
- State Management
- Prompt Templates
- Actions

![Screenshot](./assets/screenshot_0.png)

## Prerequisites

- Install [Python](https://www.python.org/downloads/) (>= 3.8)
- Install [Python VSCode Extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
- Install [Teams Toolkit VSCode Plugin](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)

## Run

> To run samples we encourage the use of the [Teams Toolkit VSCode Plugin](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension), to run the project using `Teams Toolkit` click the `Debug` button and select a profile.
![Teams Toolkit VSCode](./assets/screenshot_1.png)  
![Teams Toolkit VSCode](./assets/screenshot_2.png)

### Add Your App

When prompted, add your app in teams and start chatting!  

![Teams Toolkit VSCode](./assets/screenshot_3.png)

## Development

### Prerequisites

[Install Poetry](https://python-poetry.org/docs/)

```bash
$: pip install poetry
```

### Install Dependencies

```bash
$: poetry install
```

## Start

```bash
$: poetry run start
```

### Build

```bash
$: poetry build
```

### Test

```bash
$: poetry run test
```

### Lint

```bash
$: poetry run lint
```

## Format

```bash
$: poetry run fmt
```

## Clean

```bash
$: poetry run clean
```
