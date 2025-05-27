// Keep a store of the user to the conversation id
// In a production app, you probably would want to use a
// persistent store like a database
const userToConversationId = new Map<string, string>();

// Add a an MCP server tool
mcpServerPlugin.tool(
  'alertUser',
  'alerts the user about something important',
  {
    input: z.string().describe('the text to echo back'),
    userAadObjectId: z.string().describe('the user to alert'),
  },
  async ({ input, userAadObjectId }, { authInfo }) => {
    if (!isAuthValid(authInfo)) {
      throw new Error('Not allowed to call this tool');
    }

    const conversationId = userToConversationId.get(userAadObjectId);
    if (!conversationId) {
      console.log('Current conversation map', userToConversationId);
      return {
        content: [
          {
            type: 'text',
            text: `user ${userAadObjectId} is not in a conversation`,
          },
        ],
      };
    }

    // Leverage the app's proactive messaging capabilities to send a mesage to
    // correct conversation id.
    await app.send(conversationId, `Notification: ${input}`);
    return {
      content: [
        {
          type: 'text',
          text: `User was notified`,
        },
      ],
    };
  }
);
