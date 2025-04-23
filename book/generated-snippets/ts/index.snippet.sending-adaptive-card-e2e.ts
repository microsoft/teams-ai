app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });
  const card = new Card().withBody(
    new TextBlock('Create New Task', {
      size: 'large',
      weight: 'bolder',
    }),
    new TextInput({ id: 'title' }).withLabel('Task Title').withPlaceholder('Enter task title'),
    new TextInput({ id: 'description' })
      .withLabel('Description')
      .withPlaceholder('Enter task details')
      .withMultiLine(true),
    new ChoiceSetInput(
      { title: 'High', value: 'high' },
      { title: 'Medium', value: 'medium' },
      { title: 'Low', value: 'low' }
    )
      .withId('priority')
      .withLabel('Priority')
      .withValue('medium'),
    new DateInput({ id: 'due_date' })
      .withLabel('Due Date')
      .withValue(new Date().toISOString().split('T')[0]),
    new ActionSet(
      new ExecuteAction({ title: 'Create Task' })
        .withData({ action: 'create_task' })
        .withAssociatedInputs('auto')
        .withStyle('positive')
    )
  );
  await send(card);
  // Or build a complex activity out that includes the card:
  // const message  = new MessageActivity('Enter this form').addCard('adaptive', card);
  // await send(message);
});
