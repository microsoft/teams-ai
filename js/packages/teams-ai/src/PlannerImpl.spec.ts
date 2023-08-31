import { strict as assert } from 'assert';
import { createPlanner } from './PlannerImpl';
import { AIApiFactory } from './AIApiFactory';
import { DefaultTurnState } from './DefaultTurnStateManager';
import * as sinon from 'sinon';
import { TurnContext } from 'botbuilder';
import { ConfiguredAIOptions } from './AI';
import { PromptTemplate } from './Prompts';

describe('PlannerImpl', () => {
    const createMockFactory = (): AIApiFactory<DefaultTurnState> => {
        const completePromptStub = sinon.spy();
        const generatePlanStub = sinon.spy();
        return { completePrompt: completePromptStub, generatePlan: generatePlanStub };
    };

    const createMockArgs = (): [
        TurnContext,
        DefaultTurnState,
        PromptTemplate,
        ConfiguredAIOptions<DefaultTurnState>
    ] => {
        const mockArgs: [TurnContext, DefaultTurnState, PromptTemplate, ConfiguredAIOptions<DefaultTurnState>] = [
            {} as any,
            {} as any,
            {} as any,
            {} as any
        ];
        return mockArgs;
    };

    it('completePrompt() should call aiApiFactory.completePrompt()', () => {
        const mockFactory = createMockFactory();
        const planner = createPlanner<DefaultTurnState>(mockFactory);
        const mockedArgs = createMockArgs();
        planner.completePrompt(...mockedArgs);
        assert((mockFactory.completePrompt as sinon.SinonSpy).calledOnce);
        assert((mockFactory.completePrompt as sinon.SinonSpy).calledWith(...mockedArgs));
    });

    it('generatePlan() should call aiApiFactory.generatePlan()', () => {
        const mockFactory = createMockFactory();
        const planner = createPlanner<DefaultTurnState>(mockFactory);
        const mockedArgs = createMockArgs();
        planner.generatePlan(...mockedArgs);
        assert((mockFactory.generatePlan as sinon.SinonSpy).calledOnce);
        assert((mockFactory.generatePlan as sinon.SinonSpy).calledWith(...mockedArgs));
    });

    describe('createPlanner', () => {
        it('should return a PlannerImpl', () => {
            const mockApiFactory: any = {};
            const planner = createPlanner(mockApiFactory);
            assert.equal(typeof planner, 'object');
        });

        it('should throw an Error when aiApiFactory is falsy', () => {
            let falsyFactory: AIApiFactory<DefaultTurnState>;
            assert.throws(() => createPlanner(falsyFactory));
        });
    });
});
