app.http.use(`/settings`, async (_, res) => {
  res.sendFile(npath.join(__dirname, 'settings.html'));
});
