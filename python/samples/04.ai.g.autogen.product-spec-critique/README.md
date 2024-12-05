## Teams Autogen Bot

This is a simple project that demonstrates the use of [autogen](https://github.com/microsoft/autogen) in the context of a Microsoft Teams AI bot.
This bot models a product-spec critiquing team. 

The team consists of:
1. A questioner agent - the role of this agent is to ask questions based on some criteria for product specs at a company.
2. An answerer agent - the role of this agent is to answer the questions asked by the questioner agent based on a product spec
3. An evaluator agent - the role of this agent is to evaluate the answers given by the answerer agent based on the criteria given by the questioner agent.

The result from the evaluator agent is sent back to the Teams user. We also send back an adaptive card that contains the full transcript of the back-and-forth between the agents.

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Teams Autogen Bot](#teams-autogen-bot)
  - [Interacting with the bot](#interacting-with-the-bot)
  - [Setting up the sample](#setting-up-the-sample)
  - [Testing the sample](#testing-the-sample)
    - [Using Teams Toolkit for Visual Studio Code](#using-teams-toolkit-for-visual-studio-code)

<!-- /code_chunk_output -->

## Interacting with the bot

You can interact with the bot by messaging it.

![alt text](image.png)

## Setting up the sample

1. Follow the instructions in the [Python quickstart guide](../../../getting-started/QUICKSTART.md#python-quickstart) to set up your environment and install the necessary dependencies.

1. Duplicate the `sample.env` in the `teams-ai/python/samples/04.ai.a.twentyQuestions` folder. Rename the file to `.env`. 

1. If you are using OpenAI then only keep the `OPENAI_KEY` and add in your key. Otherwise if you are using AzureOpenAI then only keep the `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT` variables and fill them in appropriately.