import { GeographyPoint } from "@azure/search-documents"
import { OpenAIEmbeddings } from "@microsoft/teams-ai"
import { Restaurant } from "../AzureAISearchDataSource"

export async function getRestaurantData() : Promise<Restaurant[]> {
    const chickFilaADescription = "Chick-fil-A, Inc. is an American fast food restaurant chain and the largest chain specializing in chicken sandwiches. Headquartered in College Park, Georgia, Chick-fil-A operates 3,059 restaurants across 48 states, as well as in the District of Columbia and Puerto Rico. The company also has operations in Canada, and previously had restaurants in the United Kingdom and South Africa. The restaurant has a breakfast menu, and a lunch and dinner menu. The chain also provides catering services."
    const chicFilA: Restaurant = {
        restaurantId: "1",
        restaurantName: "Chick-fil-A",
        description: chickFilaADescription,
        descriptionVectorEn: await getEmbeddingVector(chickFilaADescription),
        category: "Fast Food",
        tags: ["fast food", "burgers", "fries", "shakes"],
        rating: 4.5,
        location: new GeographyPoint({
            longitude: -122.131577,
            latitude: 47.678581,
        }),
        address: {
            streetAddress: "123 Main St",
            city: "Seattle",
            stateProvince: "WA",
            postalCode: "98101",
            country: "USA"
        }
    }
    
    const starbucksDescription = "Starbucks is an American company that operates the largest coffeehouse chain and one of the most recognizable brands in the world. Headquartered in Seattle, Washington, the company operates more than 35,000 stores across 80 countries (as of 2022)."
    const starbucks: Restaurant = {
        restaurantId: "2",
        restaurantName: "Starbucks",
        description: starbucksDescription,
        descriptionVectorEn: await getEmbeddingVector(starbucksDescription),
        category: "Coffee house",
        tags: ["coffee", "drinks", "global", "shakes", "cafe", "tea"],
        rating: 4.5,
        location: new GeographyPoint({
            longitude: -122.131577,
            latitude: 47.678581,
        }),
        address: {
            streetAddress: "123 Main St",
            city: "Seattle",
            stateProvince: "WA",
            postalCode: "98101",
            country: "USA"
        }
    }

    return [chicFilA, starbucks]
}


async function getEmbeddingVector(text: string) : Promise<number[]> {
    const embeddings = new OpenAIEmbeddings({
        azureApiKey: process.env.AZURE_OPENAI_KEY!,
        azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT!,
        azureDeployment: 'text-embedding-ada-002',
    });

    const result = await embeddings.createEmbeddings("text-embedding-ada-002", text);
    if (result.status !== 'success' || !result.output) {
        throw new Error(`Failed to generate embeddings for description: ${text}`);
    }

    return result.output[0]
}