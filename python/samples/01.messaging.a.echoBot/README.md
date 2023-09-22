# <img src="../../../assets/icon.png" height="10%" width="10%" /> Echo Bot

Teams AI Conversation Bot sample for Teams.

This sample shows how to incorporate basic conversational flow into a Teams application. It also illustrates a few of the Teams specific calls you can make from your bot.

- [Concepts](#concepts)
- [Prerequisites](#prerequisites)
- [Run](#run)
- [Development](#development)

## Concepts

- Listening/Sending Activities
- Error Handling

![Screenshot](./assets/screenshot_0.png)

## Prerequisites

- Install [Python](https://www.python.org/downloads/) (>= 3.8)

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
