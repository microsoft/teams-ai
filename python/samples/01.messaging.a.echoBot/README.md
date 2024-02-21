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
- Install [Python VSCode Extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)
- Install [Poetry](https://python-poetry.org/docs/#installation)
- Install [Teams Toolkit VSCode Plugin](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension)

## Run

> To run samples we encourage the use of the [Teams Toolkit VSCode Plugin](https://marketplace.visualstudio.com/items?itemName=TeamsDevApp.ms-teams-vscode-extension), to run the project using `Teams Toolkit`:
1. Use `Python: Create Environment` command to create a virtual environment and install dependencies in `pyproject.toml`.
2. Click the `Debug` button and select a profile.
![Teams Toolkit VSCode](./assets/screenshot_1.png)  
![Teams Toolkit VSCode](./assets/screenshot_2.png)

### Add Your App

When prompted, add your app in teams and start chatting!  

![Teams Toolkit VSCode](./assets/screenshot_3.png)

## Development

### Install Dependencies

```bash
$: pip install -r src/requirements.txt
```

## Start

```bash
$: python src/app.py
```
