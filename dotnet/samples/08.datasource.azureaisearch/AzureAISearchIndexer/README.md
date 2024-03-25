# Azure AI Search Indexer

To use the Azure AI Search bot you will need to have an Azure AI Search service. You will also need to have created the `restaurants` index created.
The indexer exposes two commands to create and delete an index. The commands are:

```dotnet run -- create``` - This command will create the `restaurants` index and populate it with predefined data.

```dotnet run -- delete``` - This command will delete the index.