## Readme

This is a simple project that demonstrates the use of [autogen](https://github.com/microsoft/autogen) in the context of a Microsoft Teams AI bot.
This bot models a product-spec critiquing team. The team consists of:
1. A questioner agent - the role of this agent is to ask questions based on some criteria for product specs at a company.
2. An answerer agent - the role of this agent is to answer the questions asked by the questioner agent based on a product spec
3. An evaluator agent - the role of this agent is to evaluate the answers given by the answerer agent based on the criteria given by the questioner agent.

The result from the evaluator agent is sent back to the Teams user. We also send back an adaptive card that contains the full transcript of the back-and-forth beteween the agents.