const rawCard: ICard = {
  type: 'AdaptiveCard',
  body: [
    {
      text: 'Please fill out the below form to send a game purchase request.',
      wrap: true,
      type: 'TextBlock',
      style: 'heading',
    },
    {
      columns: [
        {
          width: 'stretch',
          items: [
            {
              choices: [
                { title: 'Call of Duty', value: 'call_of_duty' },
                { title: "Death's Door", value: 'deaths_door' },
                { title: 'Grand Theft Auto V', value: 'grand_theft' },
                { title: 'Minecraft', value: 'minecraft' },
              ],
              'choices.data': new ChoiceDataQuery('games'),
              style: 'filtered',
              placeholder: 'Search for a game',
              id: 'choiceGameSingle',
              type: 'Input.ChoiceSet',
              label: 'Game:',
            },
          ],
          type: 'Column',
        },
      ],
      type: 'ColumnSet',
    },
  ],
  actions: [
    {
      title: 'Request purchase',
      type: 'Action.Submit',
    },
  ],
  version: '1.5',
};

// Test just verifies the type system accepts it
expect(rawCard.type).toBe('AdaptiveCard');
expect(rawCard.version).toBe('1.5');
