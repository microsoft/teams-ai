// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Attachment, CardFactory } from 'botbuilder';

/**
 * Create a static search card. This card has a static list of IDEs.
 * @returns {Attachment} Static search card.
 */
export function createStaticSearchCard(): Attachment {
    return CardFactory.adaptiveCard({
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.2',
        type: 'AdaptiveCard',
        body: [
            {
                text: 'Please search for the IDE from static list.',
                wrap: true,
                type: 'TextBlock'
            },
            {
                columns: [
                    {
                        width: 'auto',
                        items: [
                            {
                                text: 'IDE: ',
                                wrap: true,
                                height: 'stretch',
                                type: 'TextBlock'
                            }
                        ],
                        type: 'Column'
                    }
                ],
                type: 'ColumnSet'
            },
            {
                columns: [
                    {
                        width: 'stretch',
                        items: [
                            {
                                choices: [
                                    {
                                        title: 'Visual studio',
                                        value: 'visual_studio'
                                    },
                                    {
                                        title: 'IntelliJ IDEA ',
                                        value: 'intelliJ_IDEA '
                                    },
                                    {
                                        title: 'Aptana Studio 3',
                                        value: 'aptana_studio_3'
                                    },
                                    {
                                        title: 'PyCharm',
                                        value: 'pycharm'
                                    },
                                    {
                                        title: 'PhpStorm',
                                        value: 'phpstorm'
                                    },
                                    {
                                        title: 'WebStorm',
                                        value: 'webstorm'
                                    },
                                    {
                                        title: 'NetBeans',
                                        value: 'netbeans'
                                    },
                                    {
                                        title: 'Eclipse',
                                        value: 'eclipse'
                                    },
                                    {
                                        title: 'RubyMine ',
                                        value: 'rubymine '
                                    },
                                    {
                                        title: 'Visual studio code',
                                        value: 'visual_studio_code'
                                    }
                                ],
                                style: 'filtered',
                                placeholder: 'Search for a IDE',
                                id: 'choiceSelect',
                                type: 'Input.ChoiceSet'
                            }
                        ],
                        type: 'Column'
                    }
                ],
                type: 'ColumnSet'
            }
        ],
        actions: [
            {
                type: 'Action.Submit',
                title: 'Submit',
                data: {
                    verb: 'StaticSubmit'
                }
            }
        ]
    });
}
