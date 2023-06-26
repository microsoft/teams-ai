# Integration tests

To run manual integrations tests `AzureOpenAIPlannerTests` and `OpenAIPlannerTests` that will make API calls to OpenAI/AzureOpenAI, you have to create a `testsettings.json` configuration file in this directory.
The file content should be the following:

```json
{
  "OpenAI": {
    "modelId": "<Model Id>", // ex. "text-davinci-003"
    "chatModelId": "<Chat Model Id>", // ex. "gpt-3.5-turbo" or any model that can be used with chat completion api
    "apiKey": "<OpenAI API key>"
  },
  "AzureOpenAI": {
   "modelId": "<Model Id>", // ex. "text-davinci-003", The name of the model in the Azure OpenAI resource
    "chatModelId": "<Chat Model Id>", // ex. "gpt-35-turbo" or any model that can be used with chat completion api
    "apiKey": "<Azure OpenAI API key>"
    "endpoint": "<Azure OpenAI API Endpoint>" // ex. https://<randomDomain>.openai.azure.com/"
  }
}
```
