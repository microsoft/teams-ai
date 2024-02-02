using Microsoft.Bot.Builder;
using Microsoft.KernelMemory;
using Microsoft.Teams.AI.AI.DataSources;
using Microsoft.Teams.AI.AI.Prompts.Sections;
using Microsoft.Teams.AI.AI.Tokenizers;
using Microsoft.Teams.AI.State;
using System.Text;

namespace TeamsChefBot
{
    /// <summary>
    /// The class connects the Kernel Memory library data source to the bot.
    /// Kernel Memory is a library that allows you to index and query any data using LLM and natural language,
    /// tracking sources and showing citations (https://github.com/microsoft/kernel-memory).
    /// </summary>
    public class KernelMemoryDataSource : IDataSource
    {
        private readonly IKernelMemory _kernelMemory;
        private readonly Task? _ingestTask;

        public KernelMemoryDataSource(string name, IKernelMemory memoryInstance)
        {
            ArgumentNullException.ThrowIfNull(memoryInstance);

            this._kernelMemory = memoryInstance;
            this.Name = name;

            if (memoryInstance.GetDocumentStatusAsync("doc-1").Result?.Completed != true)
            {
                // Ingest documents on construction
                this._ingestTask = this.IngestAsync();
            }
        }

        public string Name { get; }

        /// <summary>
        /// Loads documents from the 'files' folder into Kernel Memory's in-memory vector database.
        /// </summary>
        /// <returns></returns>
        private async Task IngestAsync()
        {
            Console.WriteLine("Loading documents from the 'files' folder into Kernel Memory's in-memory vector database");

            var importTasks = new List<Task>();
            string[] Documents = Directory.GetFiles("files");

            int i = 0;
            foreach (string doc in Documents)
            {
                importTasks.Add(this._kernelMemory.ImportDocumentAsync(doc, documentId: $"doc-{i}"));
                i++;
            }

            await Task.WhenAll(importTasks);
        }

        public async Task<RenderedPromptSection<string>> RenderDataAsync(ITurnContext context, IMemory memory, ITokenizer tokenizer, int maxTokens, CancellationToken cancellationToken = default)
        {
            if (this._ingestTask?.IsCompleted == false)
            {
                // Wait for ingestion to complete
                await _ingestTask;
            }

            string? ask = memory.GetValue("temp.input") as string;

            if (ask == null)
            {
                return new RenderedPromptSection<string>(string.Empty, 0);
            }

            // Query index for all relevant documents
            SearchResult result = await this._kernelMemory.SearchAsync(ask);

            if (result.NoResult)
            {
                Console.WriteLine("No results when querying Kernel Memory found");
                return new RenderedPromptSection<string>(string.Empty, 0);
            }

            List<Citation> citations = result.Results;

            // Add documents until you run out of tokens
            int length = 0;
            StringBuilder output = new();
            string connector = "";
            bool maxTokensReached = false;
            foreach (Citation citation in citations)
            {
                // Start a new doc
                StringBuilder doc = new();
                doc.Append($"{connector}<context>\n");
                length += tokenizer.Encode($"{connector}<context>\n").Count;
                // Add ending tag count to token count
                length += tokenizer.Encode("</context>\n").Count;

                foreach (var partition in citation.Partitions)
                {
                    // Add the partition to the doc
                    int partitionLength = tokenizer.Encode(partition.Text).Count;
                    int remainingTokens = maxTokens - (length + partitionLength);
                    if (remainingTokens < 0)
                    {
                        maxTokensReached = true;
                        break;
                    }
                    length += partitionLength;
                    doc.Append($"{partition.Text}\n");
                }

                doc.Append("</context>\n");
                output.Append(doc.ToString());
                connector = "\n\n";

                if (maxTokensReached)
                {
                    break;
                }
            }

            return new RenderedPromptSection<string>(output.ToString(), length, length > maxTokens);
        }
    }
}
