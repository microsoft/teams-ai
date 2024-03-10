import { DataSource, Memory, OpenAIEmbeddings, RenderedPromptSection, Tokenizer } from '@microsoft/teams-ai';
import { AzureKeyCredential, SearchClient, GeographyPoint } from '@azure/search-documents';
import { TurnContext } from 'botbuilder';

/**
 * Defines the Restaurant Interface.
 */
export interface Restaurant {
    restaurantId?: string;
    restaurantName?: string | null;
    description?: string | null;
    descriptionVectorEn?: number[] | null;
    category?: string | null;
    tags?: string[] | null;
    rating?: number | null;
    location?: GeographyPoint | null;
    address?: {
        streetAddress?: string | null;
        city?: string | null;
        stateProvince?: string | null;
        postalCode?: string | null;
        country?: string | null;
    } | null;
}

/**
 * Options for creating a `AzureAISearchDataSource`.
 */
export interface AzureAISearchDataSourceOptions {
    /**
     * Name of the data source. This is the name that will be used to reference the data source in the prompt template.
     */
    name: string;

    /**
     * Name of the Azure AI Search index.
     */
    indexName: string;

    /**
     * Azure OpenAI API key. AzureO
     */
    azureOpenAIApiKey: string;

    /**
     * Azure OpenAI endpoint. This is used to generate embeddings for the user's input.
     */
    azureOpenAIEndpoint: string;

    /**
     * Azure OpenAI Embedding deployment. This is used to generate embeddings for the user's input.
     */
    azureOpenAIEmbeddingDeployment: string;

    /**
     * Azure AI Search API key.
     */
    azureAISearchApiKey: string;

    /**
     * Azure AI Search endpoint.
     */
    azureAISearchEndpoint: string;
}

/**
 * A data source that uses a Azure AI Search index to inject text snippets into a prompt.
 */
export class AzureAISearchDataSource implements DataSource {
    /**
     * Name of the data source and local index.
     */
    public readonly name: string;

    /**
     * Options for creating the data source.
     */
    private readonly options: AzureAISearchDataSourceOptions;

    /**
     * Azure AI Search client.
     */
    private readonly searchClient: SearchClient<Restaurant>;

    /**
     * Creates a new `AzureAISearchDataSource` instance.
     * @param {AzureAISearchDataSourceOptions} options Options for creating the data source.
     */
    public constructor(options: AzureAISearchDataSourceOptions) {
        this.name = options.name;
        this.options = options;
        this.searchClient = new SearchClient<Restaurant>(
            options.azureAISearchEndpoint,
            options.indexName,
            new AzureKeyCredential(options.azureAISearchApiKey),
            {}
        );
    }

    /**
     * Renders the data source as a string of text.
     * @remarks
     * The returned output should be a string of text that will be injected into the prompt at render time.
     * @param {TurnContext} context Turn context for the current turn of conversation with the user.
     * @param _context
     * @param {Memory} memory An interface for accessing state values.
     * @param {Tokenizer} tokenizer Tokenizer to use when rendering the data source.
     * @param {number} maxTokens Maximum number of tokens allowed to be rendered.
     * @returns {Promise<RenderedPromptSection<string>>} A promise that resolves to the rendered data source.
     */
    public async renderData(
        _context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        maxTokens: number
    ): Promise<RenderedPromptSection<string>> {
        const query: string = memory.getValue('temp.input');

        // If the user input is empty, don't add any text to the prompt.
        if (!query) {
            return { output: '', length: 0, tooLong: false };
        }

        const selectedFields = [
            'restaurantId',
            'restaurantName',
            'description',
            'category',
            'tags',
            'rating',
            'location',
            'link',
            'address'
        ];

        //// TEXT SEARCH ////
        // Get the restaurants with the query has high lexical relevance to category, tags, and restaurant name.
        const searchResults = await this.searchClient.search(query, {
            searchFields: ['category', 'tags', 'restaurantName'],
            select: selectedFields as any
        });

        //// VECTOR SEARCH ////
        //// Get the restaurants with description that is the most similar to the user input.
        // const queryVector: number[] = await this.getEmbeddingVector(query);
        // const searchResults = await this.searchClient.search('*', {
        //     vectorSearchOptions: {
        //         queries: [
        //             {
        //                 kind: 'vector',
        //                 fields: ['descriptionVectorEn'],
        //                 kNearestNeighborsCount: 3,
        //                 // The query vector is the embedding of the user's input
        //                 vector: queryVector
        //             }
        //         ]
        //     },
        //     select: selectedFields as any
        // });

        //// HYBRID SEARCH ////
        // Search using both vector and text search
        // const queryVector: number[] = await this.getEmbeddingVector(query);
        // const searchResults = await this.searchClient.search(query, {
        //     searchFields: ['category', 'tags', 'restaurantName'],
        //     select: selectedFields as any,
        //     vectorSearchOptions: {
        //         queries: [
        //             {
        //                 kind: 'vector',
        //                 fields: ['descriptionVectorEn'],
        //                 kNearestNeighborsCount: 3,
        //                 // The query vector is the embedding of the user's input
        //                 vector: queryVector
        //             }
        //         ]
        //     },
        // });

        // Show example for how to make multiple search types

        if (!searchResults.results) {
            return { output: '', length: 0, tooLong: false };
        }

        // Concatenate the restaurant documents (i.e json object) string into a single document
        // until the maximum token limit is reached. This can be specified in the prompt template.
        let usedTokens = 0;
        let doc = '';
        for await (const result of searchResults.results) {
            const formattedResult = this.formatDocument(result.document);
            const tokens = tokenizer.encode(formattedResult).length;

            if (usedTokens + tokens > maxTokens) {
                break;
            }

            doc += formattedResult;
            usedTokens += tokens;
        }

        return { output: doc, length: usedTokens, tooLong: usedTokens > maxTokens };
    }

    /**
     * Formats the restaurant document as a json string .
     * @param {Restaurant} result The restaurant document to format.
     * @returns {string} The formatted restaurant document as a json string.
     */
    private formatDocument(result: Restaurant): string {
        return `<context>${JSON.stringify(result)}</context>`;
    }

    /**
     * Uses Azure OpenAI to generate embeddings for the user's input.
     * @param text The user's input.
     * @returns The embedding vector for the user's input.
     */
    private async getEmbeddingVector(text: string): Promise<number[]> {
        const embeddings = new OpenAIEmbeddings({
            azureApiKey: this.options.azureOpenAIApiKey,
            azureEndpoint: this.options.azureOpenAIEndpoint,
            azureDeployment: this.options.azureOpenAIEmbeddingDeployment
        });

        const result = await embeddings.createEmbeddings(this.options.azureOpenAIEmbeddingDeployment, text);
        if (result.status !== 'success' || !result.output) {
            throw new Error(`Failed to generate embeddings for description: ${text}`);
        }

        return result.output[0];
    }
}
