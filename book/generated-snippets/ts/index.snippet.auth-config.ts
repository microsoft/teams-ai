const app = new App({ 
  oauth: { // oauth configurations
    /**
     * The name of the auth connection to use.
     * It should be the same as the OAuth connection name defined in the Azure Bot configuration.
     */
    defaultConnectionName: 'graph' 
  },
  logger: new ConsoleLogger('@tests/auth', { level: 'debug' })
});
