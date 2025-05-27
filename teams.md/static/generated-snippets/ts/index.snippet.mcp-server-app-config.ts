const app = new App({
  plugins: [
    new DevtoolsPlugin(),
    // Add this plugin
    mcpServerPlugin,
  ],
});
