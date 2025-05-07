export function createLinkUnfurlCard(url: string) {
  const thumbnail = {
    title: "Unfurled Link",
    text: url,
    images: [
      {
        url: IMAGE_URL,
      },
    ],
  } as ThumbnailCard;

  const card = new AdaptiveCard(
    new TextBlock("Unfurled Link", {
      size: "Large",
      weight: "Bolder",
      color: "Accent",
      style: "heading",
    }),
    new TextBlock(url, {
      size: "Small",
      weight: "Lighter",
      color: "Good",
    })
  );

  return {
    card,
    thumbnail,
  };
}
