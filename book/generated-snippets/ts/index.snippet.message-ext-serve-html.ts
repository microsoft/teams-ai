app.http.use(`/searchSettings`, async (_, res) => {
  res.sendFile(npath.join(__dirname, 'searchSettings.html'));
});
