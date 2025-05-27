app.on("message.ext.setting", async ({ activity, send }) => {
  const { state } = activity.value
  if (state == "CancelledByUser") {
    return {
      status: 400
    }
  }
  const selectedOption = state;
  
  // Save the selected option to storage
  await app.storage.set(activity.from.id, { selectedOption })
  
  await send(`Selected option: ${selectedOption}`)

  return {
    status: 200
  }
});
