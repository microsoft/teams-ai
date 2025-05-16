---
sidebar_position: 1
---

# Activity Type Reference

The application supports a number of activity types, 

## Core Activity Routes

| Route          | Responsibility                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `message`        | User messages the app                                                                           |
| `typing`         | Sends a typing indicator to indicate the app got the user's message and is computing a response |
| `deleteUserData` | Triggered when a user requests their data to be deleted according to privacy regulations        |
| `mention`        | Triggered when the bot is @mentioned in a conversation                                          |

## Configuration Routes

| Route         | Invoke Path         | Responsibility                                                |
| ------------- | ------------------- | ------------------------------------------------------------- |
| `config.open`   | `config/fetch`        | When app is installed, the user may configure it via a dialog |
| `config.submit` | `config/submit`       | Configuration dialog submission                               |
| `tab.open`      | `tab/fetch`           | Initializes tab configuration experiences                     |
| `tab.submit`    | `tab/submit`          | Processes tab configuration submissions                       |

## Dialog Routes

| Route         | Invoke Path         | Responsibility               |
| ------------- | ------------------- | ---------------------------- |
| `dialog.open`   | `task/fetch`          | Opens a dialog               |
| `dialog.submit` | `task/submit`         | Processes dialog submissions |

## Authentication Routes

| Route                 | Invoke Path          | Responsibility                                |
| --------------------- | -------------------- | --------------------------------------------- |
| `signin.token-exchange` | `signin/tokenExchange` | When a token exchange happens during SSO Auth |
| `signin.verify-state`   | `signin/verifyState`   | When a verification passes after OAuth        |

## Message Interaction Routes

| Route           | Invoke Path             | Responsibility                                                          |
| --------------- | ----------------------- | ----------------------------------------------------------------------- |
| `message.execute` | `actionableMessage/executeAction` | An action was executed on a message                                     |
| `message.submit`  | `message/submitAction`            | Handles message action submissions                                      |
| `card.action`     | `adaptiveCard/action`             | Triggered when a user interacts with an Adaptive Card button or control |

## File Handling Routes

| Route                | Responsibility                                               |
| -------------------- | ------------------------------------------------------------ |
| `file.consent`         | Manages file sharing permission workflows in Teams           |
| `file.consent.accept`  | Triggered when user accepts a file consent card for sharing  |
| `file.consent.decline` | Triggered when user declines a file consent card for sharing |

## Message Extension Routes

| Route                           | Invoke Path                  | Responsibility                                        |
| ------------------------------- | ---------------------------- | ----------------------------------------------------- |
| `message.ext.query-link`          | `composeExtension/queryLink`           | A link unfurling request for an installed application |
| `message.ext.anon-query-link`     | `composeExtension/anonymousQueryLink`  | An anonymous link unfurling request                   |
| `message.ext.query`               | `composeExtension/query`               | Message extension search query                        |
| `message.ext.select-item`         | `composeExtension/selectItem`          | Message extension item selection                      |
| `message.ext.submit`              | `composeExtension/submitAction`        | Message extension action submission                   |
| `message.ext.open`                | `composeExtension/fetchTask`           | Message extension task fetching for an action         |
| `message.ext.query-settings-url`  | `composeExtension/querySettingUrl`     | Retrieves configuration URLs for message extensions   |
| `message.ext.setting`             | `composeExtension/setting`             | Processes message extension settings changes          |
| `message.ext.card-button-clicked` | `composeExtension/onCardButtonClicked` | Card button click handling in message extensions      |
| `message.ext.edit`                | N/A                                  | Processes edits to message extension previews         |
| `message.ext.send`                | N/A                                  | Handles sending of message extension content          |

## Lifecycle Routes

| Route          | Responsibility                                              |
| -------------- | ----------------------------------------------------------- |
| `install.add`    | Triggered when the app is newly installed to a team or chat |
| `install.remove` | Triggered when the app is uninstalled from a team or chat   |
| `install.update` | Triggered when the app is updated in a team or chat         |
| `handoff.action` | Manages handoffs from a different agent to your application |

## Conversation Update Routes

| Route           | Responsibility                                                                       |
| --------------- | ------------------------------------------------------------------------------------ |
| `membersAdded`    | Triggered when new users join a team or are added to a chat where the bot is active  |
| `membersRemoved`  | Triggered when users leave a team or are removed from a chat where the bot is active |
| `channelCreated`  | Triggered when a new channel is created in a team where the bot is installed         |
| `channelRenamed`  | Triggered when a channel is renamed in a team where the bot is installed             |
| `channelDeleted`  | Triggered when a channel is deleted from a team where the bot is installed           |
| `channelRestored` | Triggered when a previously deleted channel is restored                              |
| `teamArchived`    | Triggered when a team is archived                                                    |
| `teamDeleted`     | Triggered when a team is deleted where the bot is installed                          |
| `teamHardDeleted` | Triggered when a team is permanently deleted (beyond recovery)                       |
| `teamRenamed`     | Triggered when a team is renamed where the bot is installed                          |
| `teamRestored`    | Triggered when a previously deleted team is restored                                 |
| `teamUnarchived`  | Triggered when a team is unarchived                                                  |
| `messageUpdate`   | Triggered when a message is edited in a conversation with the bot                    |
| `messageDelete`   | Triggered when a message is deleted in a conversation with the bot                   |

## Meeting Routes

| Route                   | Invoke Path                               | Responsibility                                                             |
| ----------------------- | ----------------------------------------- | -------------------------------------------------------------------------- |
| `meetingStart`            | `application/vnd.microsoft.meetingStart`            | Triggered at the beginning of a Teams meeting where the bot is present     |
| `meetingEnd`              | `application/vnd.microsoft.meetingEnd`              | Triggered at the end of a Teams meeting where the bot is present           |
| `meetingParticipantJoin`  | `application/vnd.microsoft.meetingParticipantJoin`  | Triggered when participants join a Teams meeting where the bot is present  |
| `meetingParticipantLeave` | `application/vnd.microsoft.meetingParticipantLeave` | Triggered when participants leave a Teams meeting where the bot is present |
| `readReceipt`             | `application/vnd.microsoft.readReceipt`             | Tracks when messages are read by users                                     |
