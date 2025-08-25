const result = await prompt.send(activity.text, {
  autoFunctionCalling: false // Disable automatic function calling
});
// Extract the function call arguments from the result
const functionCallArgs = result.function_calls?.[0].arguments;

const firstCall = result.function_calls?.[0];
  const fnResult = actualFunction(firstCall.arguments);
  messages.push({
    role: 'function',
    function_id: firstCall.id,
    content: fnResult,
  });

  // Optionally, you can call the chat prompt again after updating the messages with the results
  const result = await prompt.send('What should we do next?', {
    messages,
    autoFunctionCalling: true // You can enable it here if you want
  });
  const functionCallArgs = result.function_calls?.[0].arguments; // Extract the function call arguments
  await send(`The LLM responed with the following structured output: ${JSON.stringify(functionCallArgs, undefined, 2)}.`);
