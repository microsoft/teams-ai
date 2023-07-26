const assert = require('assert');
const { ActionTypes } = require('botbuilder-core');
const { ChoiceFactory } = require('../');

function assertActivity(received, expected) {
    assert(received);
    for (const key in expected) {
        const v = received[key];
        assert(v !== undefined, `Activity.${key} missing.`);
        const ev = expected[key];
        assert.strictEqual(typeof v, typeof ev);
        if (Array.isArray(ev)) {
            assert.strictEqual(v.length, ev.length);
            assert.strictEqual(JSON.stringify(v), JSON.stringify(ev));
        } else if (typeof ev === 'object') {
            assert.strictEqual(JSON.stringify(v), JSON.stringify(ev));
        } else {
            assert.strictEqual(v, ev);
        }
    }
}

const colorChoices = ['red', 'green', 'blue'];

const choicesWithActionTitle = [
    {
        value: 'red',
        action: {
            type: ActionTypes.ImBack,
            title: 'Red Color',
        },
    },
    {
        value: 'green',
        action: {
            type: ActionTypes.ImBack,
            title: 'Green Color',
        },
    },
    {
        value: 'blue',
        action: {
            type: ActionTypes.ImBack,
            title: 'Blue Color',
        },
    },
];

const choicesWithActionValue = [
    {
        value: 'red',
        action: {
            type: ActionTypes.ImBack,
            value: 'Red Color',
        },
    },
    {
        value: 'green',
        action: {
            type: ActionTypes.ImBack,
            value: 'Green Color',
        },
    },
    {
        value: 'blue',
        action: {
            type: ActionTypes.ImBack,
            value: 'Blue Color',
        },
    },
];

const choicesWithEmptyActions = [
    {
        value: 'red',
        action: {},
    },
    {
        value: 'green',
        action: {},
    },
    {
        value: 'blue',
        action: {},
    },
];

const choicesWithPostBacks = [
    {
        value: 'red',
        action: {
            type: ActionTypes.PostBack,
        },
    },
    {
        value: 'green',
        action: {
            type: ActionTypes.PostBack,
        },
    },
    {
        value: 'blue',
        action: {
            type: ActionTypes.PostBack,
        },
    },
];

function assertChoices(choices, actionValues, actionType = ActionTypes.ImBack) {
    assert.strictEqual(choices.length, actionValues.length);
    for (let i = 0; i < choices.length; i++) {
        const choice = choices[i];
        const val = actionValues[i];
        assert.strictEqual(choice.action.type, actionType);
        assert.strictEqual(choice.action.value, val);
        assert.strictEqual(choice.action.title, val);
    }
}

describe('The ChoiceFactory', function () {
    it('should render choices inline.', function () {
        const activity = ChoiceFactory.inline(colorChoices, 'select from:');
        assertActivity(activity, {
            text: 'select from: (1) red, (2) green, or (3) blue',
        });
    });

    it('should render choices as a list.', function () {
        const activity = ChoiceFactory.list(colorChoices, 'select from:');
        assertActivity(activity, {
            text: 'select from:\n\n   1. red\n   2. green\n   3. blue',
        });
    });

    it('should render choices as suggested actions.', function () {
        const activity = ChoiceFactory.suggestedAction(colorChoices, 'select from:');
        assertActivity(activity, {
            text: 'select from:',
            suggestedActions: {
                actions: [
                    { type: 'imBack', value: 'red', title: 'red' },
                    { type: 'imBack', value: 'green', title: 'green' },
                    { type: 'imBack', value: 'blue', title: 'blue' },
                ],
            },
        });
    });

    it('should suggest the same action when a suggested action is provided', function () {
        const activity = ChoiceFactory.suggestedAction([{ value: 'Signin', action: { type: ActionTypes.Signin } }]);
        assert.strictEqual(activity.suggestedActions.actions[0].type, ActionTypes.Signin);
    });

    it('should use hero cards for channels that do not support choices (i.e. Teams)', function () {
        const expectedActivity = {
            type: 'message',
            attachmentLayout: 'list',
            attachments: [
                {
                    contentType: 'application/vnd.microsoft.card.hero',
                    content: {
                        text: 'select from:',
                        buttons: [
                            {
                                title: 'red',
                                type: 'imBack',
                                value: 'red',
                            },
                            {
                                title: 'green',
                                type: 'imBack',
                                value: 'green',
                            },
                            {
                                title: 'blue',
                                type: 'imBack',
                                value: 'blue',
                            },
                        ],
                    },
                },
            ],
            inputHint: 'expectingInput',
        };

        const choices = colorChoices.map((value) => ({
            value,
            action: { type: ActionTypes.ImBack },
        }));

        const activities = ChoiceFactory.forChannel('msteams', choices, 'select from:');
        assertActivity(activities, expectedActivity);
    });

    it('should render an inline list based on title length, choice length and channel', function () {
        const activity = ChoiceFactory.forChannel('skypeforbusiness', colorChoices, 'select from:');
        assertActivity(activity, {
            type: 'message',
            text: 'select from: (1) red, (2) green, or (3) blue',
            inputHint: 'expectingInput',
        });
    });

    it('should automatically choose render style based on channel type.', function () {
        const activity = ChoiceFactory.forChannel('emulator', colorChoices, 'select from:');
        assertActivity(activity, {
            text: 'select from:',
            suggestedActions: {
                actions: [
                    { type: 'imBack', value: 'red', title: 'red' },
                    { type: 'imBack', value: 'green', title: 'green' },
                    { type: 'imBack', value: 'blue', title: 'blue' },
                ],
            },
        });
    });

    it('should use action.title to populate action.value if action.value is falsey.', function () {
        const preparedChoices = ChoiceFactory.toChoices(choicesWithActionTitle);
        assertChoices(preparedChoices, ['Red Color', 'Green Color', 'Blue Color']);
    });

    it('should use action.value to populate action.title if action.title is falsey.', function () {
        const preparedChoices = ChoiceFactory.toChoices(choicesWithActionValue);
        assertChoices(preparedChoices, ['Red Color', 'Green Color', 'Blue Color']);
    });

    it('should use choice.value to populate action.title and action.value if both are missing.', function () {
        const preparedChoices = ChoiceFactory.toChoices(choicesWithEmptyActions);
        assertChoices(preparedChoices, ['red', 'green', 'blue']);
    });

    it('should use provided ActionType.', function () {
        const preparedChoices = ChoiceFactory.toChoices(choicesWithPostBacks);
        assertChoices(preparedChoices, ['red', 'green', 'blue'], ActionTypes.PostBack);
    });

    it('should return a stylized list.', function () {
        const listActivity = ChoiceFactory.forChannel('emulator', ['choiceTitleOverTwentyChars'], 'Test');
        assert.strictEqual(listActivity.text, 'Test\n\n   1. choiceTitleOverTwentyChars');
    });
});
