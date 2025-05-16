---
sidebar_position: 1
---

# From BotBuilder

This new iteration of Teams AI has been rebuilt from the ground up. To easy the migration process
we have created a plugin `@microsoft/teams.botbuilder`, which allows you to use a botbuilder `activity handler`
and `adapter` to send/receive activities through our new abstractions.

## Why A Plugin?

Because by using a plugin we are able to leveral all our new features while allowing developers to easily and incrementally
migration activity handlers from the legacy activity handlers to our new `App` class handlers.