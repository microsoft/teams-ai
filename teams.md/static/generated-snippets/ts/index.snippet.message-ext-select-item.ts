app.on("message.ext.select-item", async ({ activity, send }) => {
  const { option } = activity.value;

  await send(`Selected item: ${option}`);

  return {
    status: 200,
  }
});
