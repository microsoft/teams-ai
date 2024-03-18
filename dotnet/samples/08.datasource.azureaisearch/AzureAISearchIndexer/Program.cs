using AzureAISearchIndexer;
using Microsoft.Extensions.Configuration;

if (args.Length == 0)
{
    Console.WriteLine("\nUsage:");
    Console.WriteLine("indexer create");
    Console.WriteLine("indexer delete");
    return;
}

var command = args[0];
var config = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .Build();

if (config == null || config["AzureAISearchKey"] == null || config["AzureAISearchEndpoint"] == null || config["AzureOpenAIKey"] == null || config["AzureOpenAIEndpoint"] == null)
{
    Console.WriteLine("Missing some configuration values");
    return;
}

var searchKey = config["AzureAISearchKey"];
var searchEndpoint = new Uri(config["AzureAISearchEndpoint"]!);
var openAIKey = config["AzureOpenAIKey"];
var openAIEndpoint = new Uri(config["AzureOpenAIEndpoint"]!);

var indexer = new RestaurantIndexer(searchKey!, searchEndpoint, openAIKey!, openAIEndpoint);

if (command == "create")
{
    Console.WriteLine("Creating index...");
    await indexer.CreateIndex();
    Console.WriteLine("Index created.");
}
else if (command == "delete")
{
    Console.WriteLine("Deleting index...");
    indexer.DeleteIndex();
    Console.WriteLine("Index deleted.");
}
else
{
    Console.WriteLine("Invalid command");
}
