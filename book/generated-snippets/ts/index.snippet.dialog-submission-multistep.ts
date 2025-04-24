app.on('dialog.submit', async ({ activity, send, next }) => {
  const dialogType = activity.value.data.submissiondialogtype;

  if (dialogType === 'webpage_dialog_step_1') {
    // This is data from the form that was submitted
    const name = activity.value.data.name;
    const nextStepCard = new Card()
      .withBody(
        {
          type: 'TextBlock',
          text: 'Email',
          size: 'large',
          weight: 'bolder',
        },
        new TextInput()
          .withLabel('Email')
          .withRequired()
          .withId('email')
          .withPlaceholder('Enter your email')
      )
      .addActions(
        new SubmitAction().withTitle('Submit').withData({
          // This same handler will get called, so we need to identify the step
          // in the returned data
          submissiondialogtype: 'webpage_dialog_step_2',
          // Carry forward data from previous step
          name,
        })
      );
    return {
      task: {
        // This indicates that the dialog flow should continue
        type: 'continue',
        value: {
          // Here we customize the title based on the previous response
          title: `Thanks ${name} - Get Email`,
          card: cardAttachment('adaptive', nextStepCard),
        },
      },
    };
  } else if (dialogType === 'webpage_dialog_step_2') {
    const name = activity.value.data.name;
    const email = activity.value.data.email;
    await send(`Hi ${name}, thanks for submitting the form! We got that your email is ${email}`);
    // You can also return a blank response
    return {
      status: 200,
    };
  }

});
