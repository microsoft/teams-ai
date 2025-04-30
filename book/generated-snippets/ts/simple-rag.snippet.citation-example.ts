const messageActivity = new MessageActivity(result.content).addAiGenerated();
for (let i = 0; i < citedDocs.length; i++) {
  const doc = citedDocs[i];
  // The corresponding citation needs to be added in the message content
  messageActivity.text += `[${i + 1}]`;
  messageActivity.addCitation(i + 1, {
    name: doc.title,
    abstract: doc.content,
  });
}
