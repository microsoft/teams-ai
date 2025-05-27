app.on("message.ext.query-settings-url", async ({ activity }) => {
  // Get user settings from storage if available
  const userSettings = await app.storage.get(activity.from.id) || { selectedOption: '' }
  const escapedSelectedOption = encodeURIComponent(userSettings.selectedOption);

  return {
    composeExtension: {
      type: "config",
      suggestedActions: {
        actions: [
          {
            type: "openUrl",
            title: "Settings",
            // ensure the bot endpoint is set in the environment variables
            // process.env.BOT_ENDPOINT is not populated by default in the Teams Toolkit setup. 
            value: `${process.env.BOT_ENDPOINT}/tabs/settings?selectedOption=${escapedSelectedOption}`
          }
        ]
      }
    }
  };
});
