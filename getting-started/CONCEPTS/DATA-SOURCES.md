# Data Sources
Data sources allow the injection of relevant information from external sources into prompts, such as vector databases or cognitive search. A vector data source makes it easy to add [RAG](https://en.wikipedia.org/wiki/Prompt_engineering#Retrieval-augmented_generation) to any prompt, allowing for better and more accurate replies from the bot. 
 
Within each Action Planner’s prompt management system, a list of data sources can be registered. For each data source, a max number of tokens to use is specified, via `maxTokens`. 

## Customize a Data Source
1. Construct a class that implements our `DataSource` base class. 
    
2. Register the data source with your prompt management system through the `addDataSource` function. 

3. To augment a specific prompt, you can specify the name(s) of the data sources within the prompt's `config.json` file.   

Our simplest example (primarily for testing) is `TextDataSource`, which adds a static block of text to a prompt.  

Our most complex example is the `VectraDataSource` in the Chef Bot sample, which uses an external library called Vectra.

### Customized Example of VectraDataSource
Here is an example of the configuration for the
[Chef Bot sample](https://github.com/microsoft/teams-ai/tree/main/js/samples/04.ai.a.teamsChefBot):

**JS**
```js
// Inside VectraDataSource.ts
export class VectraDataSource implements DataSource 
```

```js
// Inside of index.ts
planner.prompts.addDataSource(
    new VectraDataSource({
        name: 'teams-ai',
        apiKey: process.env.OPENAI_KEY!,
        azureApiKey: process.env.AZURE_OPENAI_KEY!,
        azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
        indexFolder: path.join(__dirname, '../index')
    })
);
```
Inside the prompt's config.json. Here, `teams-ai` denotes the name of the VectraDataSource, and 1200 is `maxTokens`.
```json
"augmentation": {
    "augmentation_type": "none",
    "data_sources": {
        "teams-ai": 1200
    }
}
```