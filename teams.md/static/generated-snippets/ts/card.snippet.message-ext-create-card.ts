interface FormData {
  title: string;
  subtitle: string;
  text: string;
}

export function createCard(data: FormData) {
  return new AdaptiveCard(
    new Image(IMAGE_URL),
    new TextBlock(data.title, {
      size: "Large",
      weight: "Bolder",
      color: "Accent",
      style: "heading",
    }),
    new TextBlock(data.subtitle, {
      size: "Small",
      weight: "Lighter",
      color: "Good",
    }),
    new TextBlock(data.text, {
      wrap: true,
      spacing: "Medium",
    })
  );
}
