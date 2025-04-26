app.on('message.submit.feedback', async ({ activity }) => {
  const { reaction, feedback: feedbackJson } = activity.value.actionValue;
  if (activity.replyToId == null) {
    console.warn(`No replyToId found for messageId ${activity.id}`);
    return;
  }
  const existingFeedback = storedFeedbackByMessageId.get(activity.replyToId);
  /**
   * feedbackJson looks like:
   * {"feedbackText":"Nice!"}
   */
  if (!existingFeedback) {
    console.warn(`No feedback found for messageId ${activity.id}`);
  } else {
    storedFeedbackByMessageId.set(activity.id, {
      ...existingFeedback,
      likes: existingFeedback.likes + (reaction === 'like' ? 1 : 0),
      dislikes: existingFeedback.dislikes + (reaction === 'dislike' ? 1 : 0),
      feedbacks: [...existingFeedback.feedbacks, feedbackJson],
    });
  }
});
