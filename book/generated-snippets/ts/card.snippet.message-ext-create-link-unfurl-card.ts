export function createLinkUnfurlCard(url: string) {
  const thumbnail = {
    title: 'Unfurled Link',
    text: url,
    images: [
      {
        url: IMAGE_URL,
      },
    ],
  } as ThumbnailCard;

  const card = new Card(
    new TextBlock('Unfurled Link', {
      size: 'large',
      weight: 'bolder',
      color: 'accent',
      style: 'heading',
    }),
    new TextBlock(url, {
      size: 'small',
      weight: 'lighter',
      color: 'good',
    })
  );

  return {
    card,
    thumbnail,
  };
}
