app.on("dialog.submit", async ({ activity, send, next }) => {
  const dialogType = activity.value.data?.submissiondialogtype;

  if (dialogType === "simple_form") {
    // This is data from the form that was submitted
    const name = activity.value.data.name;
    await send(`Hi ${name}, thanks for submitting the form!`);
    return {
      task: {
        type: "message",
        // This appears as a final message in the dialog
        value: "Form was submitted",
      },
    };
  }

});
