---
sidebar_position: 3
summary: Tutorial on implementing multi-step dialogs in Teams, demonstrating how to create dynamic form flows that adapt based on user input, with examples of handling state between steps and conditional navigation.
---

# Handling Multi-Step Forms

Dialogs can become complex yet powerful with multi-step forms. These forms can alter the flow of the survey depending on the user's input or customize subsequent steps based on previous answers.

Start off by sending an initial card in the `dialog_open` event.

```python
dialog_card = AdaptiveCard.model_validate(
            {
                "type": "AdaptiveCard",
                "version": "1.4",
                "body": [
                    {"type": "TextBlock", "text": "This is a multi-step form", "size": "Large", "weight": "Bolder"},
                    {
                        "type": "Input.Text",
                        "id": "name",
                        "label": "Name",
                        "placeholder": "Enter your name",
                        "isRequired": True,
                    },
                ],
                "actions": [
                    {
                        "type": "Action.Submit",
                        "title": "Submit",
                        "data": {"submissiondialogtype": "webpage_dialog_step_1"},
                    }
                ],
            }
        )
```

Then in the submission handler, you can choose to `continue` the dialog with a different card.

```python

@app.on_dialog_submit
async def handle_dialog_submit(ctx: ActivityContext[TaskSubmitInvokeActivity]):
    """Handle dialog submit events for all dialog types."""
    data: Optional[Any] = ctx.activity.value.data
    dialog_type = data.get("submissiondialogtype") if data else None

    if dialog_type == "webpage_dialog":
        name = data.get("name") if data else None
        email = data.get("email") if data else None
        await ctx.send(f"Hi {name}, thanks for submitting the form! We got that your email is {email}")
        return InvokeResponse(
            body=TaskModuleResponse(task=TaskModuleMessageResponse(value="Form submitted successfully"))
        )

    elif dialog_type == "webpage_dialog_step_1":
        name = data.get("name") if data else None
        next_step_card = AdaptiveCard.model_validate(
            {
                "type": "AdaptiveCard",
                "version": "1.4",
                "body": [
                    {"type": "TextBlock", "text": "Email", "size": "Large", "weight": "Bolder"},
                    {
                        "type": "Input.Text",
                        "id": "email",
                        "label": "Email",
                        "placeholder": "Enter your email",
                        "isRequired": True,
                    },
                ],
                "actions": [
                    {
                        "type": "Action.Submit",
                        "title": "Submit",
                        "data": {"submissiondialogtype": "webpage_dialog_step_2", "name": name},
                    }
                ],
            }
        )

        return InvokeResponse(
            body=TaskModuleResponse(
                task=TaskModuleContinueResponse(
                    value=CardTaskModuleTaskInfo(
                        title=f"Thanks {name} - Get Email",
                        card=card_attachment(AdaptiveCardAttachment(content=next_step_card)),
                    )
                )
            )
        )

    elif dialog_type == "webpage_dialog_step_2":
        name = data.get("name") if data else None
        email = data.get("email") if data else None
        await ctx.send(f"Hi {name}, thanks for submitting the form! We got that your email is {email}")
        return InvokeResponse(
            body=TaskModuleResponse(task=TaskModuleMessageResponse(value="Multi-step form completed successfully"))
        )

    return TaskModuleResponse(task=TaskModuleMessageResponse(value="Unknown submission type"))

```