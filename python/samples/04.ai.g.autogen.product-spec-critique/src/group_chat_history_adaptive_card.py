from botbuilder.core import CardFactory
from botbuilder.schema import Attachment
from autogen import ChatResult

def create_chat_history_ac(message: ChatResult) -> Attachment:
    facts = []
    for value in message.chat_history:
        if value.get("name") is not None:
            facts.append({
                "title": value["name"],
                "value": value["content"]
            })

    return CardFactory.adaptive_card(
        {
            "type": "AdaptiveCard",
            "speak": "3 minute energy flow with kayo video",
            "$schema": "https://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.5",
            "body": [
                {
                    "type": "TextBlock",
                    "wrap": True,
                    "text": "Agent Reasoning",
                    "style": "heading",
                    "size": "Medium"
                },
                {
                    "type": "TextBlock",
                    "wrap": True,
                    "text": "You can view the agent's internal conversation by toggling the card below"
                },
                {
                    "type": "ActionSet",
                    "actions": [
                        {
                            "type": "Action.ShowCard",
                            "title": "Show internal discussion",
                            "card": {
                                "type": "AdaptiveCard",
                                "body": [
                                    {
                                        "type": "FactSet",
                                        "facts": facts
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        }
    )
