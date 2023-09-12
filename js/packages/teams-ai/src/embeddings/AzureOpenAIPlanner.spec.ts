import { strict as assert } from 'assert';
import { AzureOpenAIClient, OpenAIClient } from './OpenAIClients';
import { AzureOpenAIPlanner, AzureOpenAIPlannerOptions } from './AzureOpenAIPlanner';

describe('OpenAIPlanner', () => {
    describe('createClient()', () => {
        it('should return an AzureOpenAIClient', () => {
            class TestAzureOpenAIPlanner extends AzureOpenAIPlanner {
                constructor(options: AzureOpenAIPlannerOptions) {
                    super(options);
                }

                protected createClient(options: AzureOpenAIPlannerOptions): OpenAIClient {
                    const client = super.createClient(options);
                    assert(client instanceof AzureOpenAIClient);
                    return client;
                }
            }

            const mockOpts = {
                apiKey: 'test',
                defaultModel: 'test',
                endpoint: 'https://https://github.com/microsoft/teams-ai'
            };
            new TestAzureOpenAIPlanner(mockOpts);
        });
    });
});
