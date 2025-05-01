interface FormData {
  title: string;
  subtitle: string;
  text: string;
}

export function createCard(data: FormData) {
  return new Card(
    new Image(IMAGE_URL),
    new TextBlock(data.title, {
      size: 'large',
      weight: 'bolder',
      color: 'accent',
      style: 'heading',
    }),
    new TextBlock(data.subtitle, {
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
