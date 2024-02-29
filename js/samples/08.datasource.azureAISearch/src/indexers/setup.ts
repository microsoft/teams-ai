import { AzureKeyCredential, SearchClient, SearchIndexClient } from "@azure/search-documents"
import { createIndexIfNotExists, delay, upsertDocuments } from "./utils"
import { Restaurant } from "../AzureAISearchDataSource"
import { getRestaurantData } from "./data"

export async function main() {
    const index = "restaurants"

    if (!process.env.AZURE_SEARCH_KEY || !process.env.AZURE_SEARCH_ENDPOINT || !process.env.AZURE_OPENAI_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
        throw new Error('Missing environment variables - please check that AZURE_SEARCH_KEY, AZURE_SEARCH_ENDPOINT, AZURE_OPENAI_KEY, and AZURE_OPENAI_ENDPOINT are set.');
    }
    
    const searchApiKey = process.env.AZURE_SEARCH_KEY!
    const searchApiEndpoint = process.env.AZURE_SEARCH_ENDPOINT!
    const credentials = new AzureKeyCredential(searchApiKey)
    
    const searchIndexClient = new SearchIndexClient(searchApiEndpoint, credentials)
    createIndexIfNotExists(searchIndexClient, index);
    // Wait 5 seconds for the index to be created
    await delay(5000)

    const searchClient = new SearchClient<Restaurant>(searchApiEndpoint, index, credentials)
    
    const data = await getRestaurantData();
    await upsertDocuments(searchClient, data)
}

main();