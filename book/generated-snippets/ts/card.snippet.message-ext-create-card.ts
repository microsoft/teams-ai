interface FormData {
  title: string;
  subTitle: string;
  text: string;
}


export function createCard(data: FormData) {
  const cardImageUrl =
    'https://github.com/microsoft/teams-agent-accelerator-samples/raw/main/python/memory-sample-agent/docs/images/memory-thumbnail.png';
  return new Card(
    new Image(cardImageUrl),
    new TextBlock(data.title, {
      size: 'large',
      weight: 'bolder',
      color: 'accent',
      style: 'heading',
    }),
    new TextBlock(data.subTitle, {
      size: 'small',
      weight: 'lighter',
      color: 'good',
    }),
    new TextBlock(data.text, {
      wrap: true,
      spacing: 'medium',
    })
  );
}
