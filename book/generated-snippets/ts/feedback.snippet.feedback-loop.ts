const { id: sentMessageId } = await send(
  result.content != null
    ? new MessageActivity(result.content)
        .addAiGenerated()
        /** Add feedback buttons via this method */
        .addFeedback()
    : 'I did not generate a response.'
);

storedFeedbackByMessageId.set(sentMessageId, {
  incomingMessage: activity.text,
  outgoingMessage: result.content ?? '',
  likes: 0,
  dislikes: 0,
  feedbacks: [],
});

