/**
 * Defines the utility methods.
 */

import {
    SearchIndexClient,
    SearchIndex,
    KnownAnalyzerNames,
    SearchClient,
    IndexDocumentsResult
} from '@azure/search-documents';
import { Restaurant } from '../AzureAISearchDataSource';

export const WAIT_TIME = 4000;

export const documentKeyRetriever: (document: Restaurant) => string = (document: Restaurant): string => {
    return document.restaurantId!;
};

/**
 * A wrapper for setTimeout that resolves a promise after timeInMs milliseconds.
 * @param timeInMs - The number of milliseconds to be delayed.
 * @returns Promise that is resolved after timeInMs
 */
export function delay(timeInMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeInMs));
}

/**
 * Deletes the index with the given name
 * @param client The search index client
 * @param name The name of the index
 */
export function deleteIndex(client: SearchIndexClient, name: string): Promise<void> {
    return client.deleteIndex(name);
}

/**
 * Adds or updates the given documents in the index
 * @param client The search index client
 * @param documents The documents to be added or updated
 * @returns The result of the operation
 */
export async function upsertDocuments(
    client: SearchClient<Restaurant>,
    documents: Restaurant[]
): Promise<IndexDocumentsResult> {
    return await client.mergeOrUploadDocuments(documents);
}

/**
 * Creates the index with the given name
 * @param client The search index client
 * @param name The name of the index
 */
export async function createIndexIfNotExists(client: SearchIndexClient, name: string): Promise<void> {
    const RestaurantIndex: SearchIndex = {
        name,
        fields: [
            {
                type: 'Edm.String',
                name: 'restaurantId',
                key: true,
                filterable: true,
                sortable: true
            },
            {
                type: 'Edm.String',
                name: 'restaurantName',
                searchable: true,
                filterable: true,
                sortable: true
            },
            {
                type: 'Edm.String',
                name: 'description',
                searchable: true,
                analyzerName: KnownAnalyzerNames.EnLucene
            },
            {
                type: 'Collection(Edm.Single)',
                name: 'descriptionVectorEn',
                searchable: true,
                vectorSearchDimensions: 1536,
                vectorSearchProfileName: 'vector-search-profile'
            },
            {
                type: 'Edm.String',
                name: 'category',
                searchable: true,
                filterable: true,
                sortable: true,
                facetable: true
            },
            {
                type: 'Collection(Edm.String)',
                name: 'tags',
                searchable: true,
                filterable: true,
                facetable: true
            },
            {
                type: 'Edm.Boolean',
                name: 'parkingIncluded',
                filterable: true,
                sortable: true,
                facetable: true
            },
            {
                type: 'Edm.Boolean',
                name: 'smokingAllowed',
                filterable: true,
                sortable: true,
                facetable: true
            },
            {
                type: 'Edm.DateTimeOffset',
                name: 'lastRenovationDate',
                filterable: true,
                sortable: true,
                facetable: true
            },
            {
                type: 'Edm.Double',
                name: 'rating',
                filterable: true,
                sortable: true,
                facetable: true
            },
            {
                type: 'Edm.GeographyPoint',
                name: 'location',
                filterable: true,
                sortable: true
            },
            {
                type: 'Edm.ComplexType',
                name: 'address',
                fields: [
                    {
                        type: 'Edm.String',
                        name: 'streetAddress',
                        searchable: true
                    },
                    {
                        type: 'Edm.String',
                        name: 'city',
                        searchable: true,
                        filterable: true,
                        sortable: true,
                        facetable: true
                    },
                    {
                        type: 'Edm.String',
                        name: 'stateProvince',
                        searchable: true,
                        filterable: true,
                        sortable: true,
                        facetable: true
                    },
                    {
                        type: 'Edm.String',
                        name: 'country',
                        searchable: true,
                        filterable: true,
                        sortable: true,
                        facetable: true
                    },
                    {
                        type: 'Edm.String',
                        name: 'postalCode',
                        searchable: true,
                        filterable: true,
                        sortable: true,
                        facetable: true
                    }
                ]
            }
        ],
        suggesters: [
            {
                name: 'sg',
                sourceFields: ['description', 'restaurantName'],
                searchMode: 'analyzingInfixMatching'
            }
        ],
        scoringProfiles: [
            {
                name: 'nearest',
                functionAggregation: 'sum',
                functions: [
                    {
                        type: 'distance',
                        fieldName: 'location',
                        boost: 2,
                        parameters: {
                            referencePointParameter: 'myloc',
                            boostingDistance: 100
                        }
                    }
                ]
            }
        ],
        corsOptions: {
            // for browser tests
            allowedOrigins: ['*']
        },
        vectorSearch: {
            algorithms: [{ name: 'vector-search-algorithm', kind: 'hnsw' }],
            profiles: [
                {
                    name: 'vector-search-profile',
                    algorithmConfigurationName: 'vector-search-algorithm'
                }
            ]
        }
    };

    await client.createOrUpdateIndex(RestaurantIndex);
}
