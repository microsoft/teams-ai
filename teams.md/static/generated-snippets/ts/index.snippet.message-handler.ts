app.on("card.action", async ({ activity, send }) => {
  const data = activity.value?.action?.data;
  if (!data?.action) {
    return {
      statusCode: 400,
      type: "application/vnd.microsoft.error",
      value: {
        code: "BadRequest",
        message: "No action specified",
        innerHttpError: {
          statusCode: 400,
          body: { error: "No action specified" },
        },
      },
    } satisfies AdaptiveCardActionErrorResponse;
  }

  console.debug("Received action data:", data);

  switch (data.action) {
    case "submit_feedback":
      await send(`Feedback received: ${data.feedback}`);
      break;

    case "purchase_item":
      await send(
        `Purchase request received for game: ${data.choiceGameSingle}`
      );
      break;

    case "save_profile":
      await send(
        `Profile saved!\nName: ${data.name}\nEmail: ${data.email}\nSubscribed: ${data.subscribe}`
      );
      break;

    default:
      return {
        statusCode: 400,
        type: "application/vnd.microsoft.error",
        value: {
          code: "BadRequest",
          message: "Unknown action",
          innerHttpError: {
            statusCode: 400,
            body: { error: "Unknown action" },
          },
        },
      } satisfies AdaptiveCardActionErrorResponse;
  }

  return {
    statusCode: 200,
    type: "application/vnd.microsoft.activity.message",
    value: "Action processed successfully",
  } satisfies AdaptiveCardActionMessageResponse;
});
