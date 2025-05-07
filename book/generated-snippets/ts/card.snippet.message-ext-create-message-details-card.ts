export function createMessageDetailsCard(messagePayload: Message) {
  const cardElements: CardElement[] = [
    new TextBlock("Message Details", {
      size: "Large",
      weight: "Bolder",
      color: "Accent",
      style: "heading",
    }),
  ];

  if (messagePayload?.body?.content) {
    cardElements.push(
      new TextBlock("Content", {
        size: "Medium",
        weight: "Bolder",
        spacing: "Medium",
      }),
      new TextBlock(messagePayload.body.content)
    );
  }

  if (messagePayload?.attachments?.length) {
    cardElements.push(
      new TextBlock("Attachments", {
        size: "Medium",
        weight: "Bolder",
        spacing: "Medium",
      }),
      new TextBlock(
        `Number of attachments: ${messagePayload.attachments.length}`,
        {
          wrap: true,
          spacing: "Small",
        }
      )
    );
  }

  if (messagePayload?.createdDateTime) {
    cardElements.push(
      new TextBlock("Created Date", {
        size: "Medium",
        weight: "Bolder",
        spacing: "Medium",
      }),
      new TextBlock(messagePayload.createdDateTime, {
        wrap: true,
        spacing: "Small",
      })
    );
  }

  if (messagePayload?.linkToMessage) {
    cardElements.push(
      new TextBlock("Message Link", {
        size: "Medium",
        weight: "Bolder",
        spacing: "Medium",
      }),
      new ActionSet(
        new OpenUrlAction(messagePayload.linkToMessage, {
          title: "Go to message",
        })
      )
    );
  }

  return new AdaptiveCard(...cardElements);
}
