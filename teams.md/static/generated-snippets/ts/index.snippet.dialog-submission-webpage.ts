// The submission from a webpage happens via the microsoftTeams.tasks.submitTask(formData)
// call.
app.on("dialog.submit", async ({ activity, send, next }) => {
  const dialogType = activity.value.data.submissiondialogtype;

  if (dialogType === "webpage_dialog") {
    // This is data from the form that was submitted
    const name = activity.value.data.name;
    const email = activity.value.data.email;
    await send(
      `Hi ${name}, thanks for submitting the form! We got that your email is ${email}`
    );
    // You can also return a blank response
    return {
      status: 200,
    };
  }

});
