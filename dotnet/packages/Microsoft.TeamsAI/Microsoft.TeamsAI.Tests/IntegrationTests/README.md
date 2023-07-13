# Integration tests

To run manual integrations tests `AzureOpenAIPlannerTests`, `OpenAIPlannerTests` and `AzureContentSafetyModeratorTests` that will make API calls to OpenAI/AzureOpenAI/AzureContentSafety, you have to create a `testsettings.json` configuration file in this directory.
The file content should be the following:

```json
{
  "OpenAI": {
    "modelId": "<Model Id>",
    "chatModelId": "<Chat Model Id>",
    "apiKey": "<OpenAI API key>"
  },
  "AzureOpenAI": {
   "modelId": "<Model Id>",
   "chatModelId": "<Chat Model Id>",
    "apiKey": "<Azure OpenAI API key>",
    "endpoint": "<Azure OpenAI API Endpoint>"
  },
  "AzureContentSafety": {
    "apiKey": "<Azure Content Safety API key>",
    "endpoint": "<Azure Content Safety endpoint>"
  }
}
```

`modelId`: ex. "text-davinci-003". If using Azure Open AI then this will be the model deployment name.
`chatModelId`: ex. "gpt-3.5-turbo" or any model that can be used with chat completion api.
`apiKey`: the API key.
`endpoint`: the endpoint for Azure OpenAI or Azure Content Safety. ex. https://<randomDomain>.openai.azure.com/ or https://<randomDomain>.cognitiveservices.azure.com/
