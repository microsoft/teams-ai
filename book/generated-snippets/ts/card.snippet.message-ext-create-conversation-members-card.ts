export function createConversationMembersCard(members: Account[]) {
  const membersList = members.map((member) => member.name).join(', ');

  return new Card(
    new TextBlock('Conversation members', {
      size: 'medium',
      weight: 'bolder',
      color: 'accent',
      style: 'heading',
    }),
    new TextBlock(membersList, {
      wrap: true,
      spacing: 'small',
    })
  );
}
