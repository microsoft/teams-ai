export async function createDummyCards(searchQuery: string) {
  const dummyItems = [
    {
      title: "Item 1",
      description: `This is the first item and this is your search query: ${searchQuery}`,
    },
    { title: "Item 2", description: "This is the second item" },
    { title: "Item 3", description: "This is the third item" },
    { title: "Item 4", description: "This is the fourth item" },
    { title: "Item 5", description: "This is the fifth item" },
  ];

  const cards = dummyItems.map((item) => {
    return {
      card: new AdaptiveCard(
        new TextBlock(item.title, {
          size: "Large",
          weight: "Bolder",
          color: "Accent",
          style: "heading",
        }),
        new TextBlock(item.description, {
          wrap: true,
          spacing: "Medium",
        })
      ),
      thumbnail: {
        title: item.title,
        text: item.description,
      } as ThumbnailCard,
    };
  });

  return cards;
}
