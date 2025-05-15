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
        // When a user clicks on a list item in Teams:
        // - If the thumbnail has a `tap` property: Teams will trigger the `message.ext.select-item` activity
        // - If no `tap` property: Teams will insert the full adaptive card into the compose box
        // tap: { 
        //   type: "invoke",
        //   title: item.title,
        //   value: {
        //     "option": index,
        //   },
        // },
      } satisfies ThumbnailCard,
    };
  });

  return cards;
}
