const app = new App({ 
  oauth: { // oauth configurations
    // the name of the auth connection to use.
    // it should be the same as the OAuth connection name defined in the Azure Bot configuration.
    defaultConnectionName: 'graph' 
  },
  logger: new ConsoleLogger('@tests/auth', { level: 'debug' }), // optional
  plugins: [new DevtoolsPlugin()], // optional
});
