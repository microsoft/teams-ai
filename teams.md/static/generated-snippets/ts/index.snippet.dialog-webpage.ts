return {
  task: {
    type: 'continue',
    value: {
      title: 'Webpage Dialog',
      // Here we are using a webpage that is hosted in the same
      // server as the agent. This server needs to be publicly accessible,
      // needs to set up teams.js client library (https://www.npmjs.com/package/@microsoft/teams-js)
      // and needs to be registered in the manifest.
      url: `${process.env['BOT_ENDPOINT']}/tabs/dialog-form`,
      width: 1000,
      height: 800,
    },
  },
};
