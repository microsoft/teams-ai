import { strict as assert } from 'assert';
import { OpenAIPlannerOptions, OpenAIPlanner } from './OpenAIPlanner';
import { OpenAIClient } from './OpenAIClients';

/* eslint-disable security/detect-object-injection */
describe('OpenAIPlanner', () => {
    const createMockOptions = (): OpenAIPlannerOptions => ({
        apiKey: 'test',
        defaultModel: 'test'
    });

    describe('constructor()', () => {
        it('should not modify passed in options', () => {
            const mockOpts = createMockOptions();
            const planner = new OpenAIPlanner(mockOpts);

            const options = planner.options;
            assert.notDeepEqual(options, mockOpts);
            assert.equal(options.oneSayPerTurn, false);
            assert.equal(options.useSystemMessage, false);
            assert.equal(options.logRequests, false);
        });

        it('should call createClient() during construction', () => {
            let createClientCalled = false;
            class TestOpenAIPlanner extends OpenAIPlanner {
                constructor(options: OpenAIPlannerOptions) {
                    super(options);
                }

                protected createClient(options: OpenAIPlannerOptions): OpenAIClient {
                    createClientCalled = true;
                    return super.createClient(options);
                }
            }
            const mockOpts = createMockOptions();
            new TestOpenAIPlanner(mockOpts);

            assert(createClientCalled);
        });
    });
});
