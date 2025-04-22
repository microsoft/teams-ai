new ActionSet(
  new ExecuteAction({ title: 'Submit Feedback' })
    .withData({ action: 'submit_feedback' })
    .withAssociatedInputs('auto'),
  new OpenUrlAction('https://adaptivecards.microsoft.com').withTitle('Learn More')
