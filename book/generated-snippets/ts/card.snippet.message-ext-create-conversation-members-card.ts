export function createConversationMembersCard(members: Account[]) {
  const membersList = members.map((member) => member.name).join(", ");

  return new AdaptiveCard(
    new TextBlock("Conversation members", {
      size: "Medium",
      weight: "Bolder",
      color: "Accent",
      style: "heading",
    }),
    new TextBlock(membersList, {
      wrap: true,
      spacing: "Small",
    })
  );
}
