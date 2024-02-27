# Migrating from the BotFramework SDK (Python)

_**Navigation**_
- [00.OVERVIEW](./README.md)
- [01.JS](./JS.md)
- [02.DOTNET](./DOTNET.md)
- [**03.PYTHON**](./PYTHON.md)
___

If you have a bot built using the Python BotFramework SDK, the following will help you update your bot to the Teams AI library.

## New Project or Migrate Existing App

Since the library builds on top of the BF SDK, much of the bot logic can be directly carried over to the Teams AI app. If you want to start with a new project, set up the Echo bot sample in the [quick start](./../QUICKSTART.md) guide and jump directly to [step 2](#2-replace-the-activity-handler-implementations-with-specific-route-registration-methods).

If you want to migrate your existing app start with [step 1](#1-replace-the-activityhandler-with-the-application-object).

## 1. Replace the ActivityHandler with the Application object

Replace `ActivityHandler` with `Application`.

```diff
+ from teams-ai import Application, ApplicationOptions, TurnState;

- class Bot(ActivityHandler);
- my_bot = Bot()

// inside bot.py, define your application and storage
+ storage = MemoryStorage()
+ app = Application[TurnState](
+    ApplicationOptions(
+       storage=storage 
+     )
+ )
```

## 2. Replace the activity handler implementations with specific route registration methods

The `TeamsActivityHandler` class derives from the `ActivityHandler` class. Each method in the class corresponds to a specific route registration method (`handler`) in the `Application` object. Here's a simple example:

Given the `TeamsActivityHandler` implementation:

```python
class TeamsActivityHandler(ActivityHandler):
    async def on_message_activity( 
        self, turn_context: TurnContext
    ):
        """
        Override this method in a derived class to provide logic specific to activities,
        such as the conversational logic.

        :param turn_context: The context object for this turn
        :type turn_context: :class:`botbuilder.core.TurnContext`

        :returns: A task that represents the work queued to execute
        """
        return
```

This is how a route should be added to the `Application` object:

```python
@app.activity("message")
async def on_message(context: TurnContext, _state: TurnState):
    await context.send_activity(f"you said: {context.activity.text}")
    return True
```

>  The `activity` method is referred as a *route registration method*. For each method in the `ActivityHandler` or `TeamsActivityHandler` class, there is an equivalent route registration method. 

Your existing BF app will probably have different activity handlers implemented. To migrate that over with Teams AI route registration methods see the following.

## Activity Handler Methods

If your bot derives from the `TeamsActivityHandler` refer to the following table to see which method maps to which `Application` route registration method.

### Invoke Activities

| `TeamsActivityHandler` method                               | `Application` route registration method                                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `on_teams_task_module_fetch`                                | `task_modules.fetch` (usage: `app.task_modules.fetch(...)`)                                       |
| `on_teams_task_module_submit`                               | `task_modules.submit`                                                       |
| `on_teams_app_based_link_query`                              | `message_extensions.query_link`                   |                                                          |
| `on_teams_messaging_extension_query`                        | `message_extensions.query`                                                                       |
| `on_teams_messaging_extension_select_item`               | `message_extensions.select_item`                                                                  |
| `on_teams_messaging_extension_submit_action_dispatch`         | `message_extensions.submit_action`                                                                |
| `on_teams_messaging_extension_fetch_task`                    | `message_extensions.fetch_task`                                                                   |
| `on_teams_messaging_extension_configuration_query_settings_url` | `message_extensions.query_setting_url`                                                             |
| `on_teams_messaging_extension_configuration_setting`         | `message_extensions.configure_settings`                                                           |                                                 
### Conversation Update Activities

These are the following methods from the `TeamsActivityHandler` from `on_conversation_update_activity`:

- `on_teams_channel_created`
- `on_teams_channel_deleted`
- `on_teams_channel_renamed`
- `on_teams_team_archived`
- `on_teams_team_deleted`
- `on_teams_team_hard_deleted`
- `on_teams_channel_restored`
- `on_teams_team_renamed`
- `on_teams_team_restored`
- `on_teams_team_unarchived`

These activities can be handled using the `app.conversation_update` method. 

For example in the `TeamsActivityHandler`:

```python
 async def on_teams_channel_created(
        self, channel_info: ChannelInfo, team_info: TeamInfo, turn_context: TurnContext
):(...)
```

The `Application` equivalent:

There are two ways to use our activity methods- (a) decorator and (b) method.

```python
    # Use this method as a decorator
    @app.conversation_update("channelCreated")
    async def on_channel_created(context: TurnContext, state: TurnState):
        print("a new channel was created!")
        return True

    # Pass a function to this method
    app.conversation_update("channelCreated")(on_channel_created)
```

> Note that the first parameter `type` specifies which conversation update event to handle.

### Message Activites

| `TeamsActivityHandler` method                                               | `Application` route registration method                                                |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `on_message_activity`                                                                 | `message`                                                                  |
| `on_message_reaction_activity`                                                 | `message_reaction`                                                         |


### Meeting Activities

| `TeamsActivityHandler` method     | `Application` route registration method  |
| --------------------------------- | ---------------------------- |
| `on_teams_meeting_start_event`             | `meetings.start`             |
| `on_teams_meeting_end_event`               | `meetings.end`               |


### Other Activities

If there are activities for which there isn't a corresponding route registration method, you can use the generic route registration method `app.activity("event")` and specify a custom selector function given the activity object as input.
