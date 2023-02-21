/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PredictedCommand, PredictedDoCommand, PredictedSayCommand } from './PredictionEngine';

const BREAKING_CHARACTERS = '`~!@#$%^&*()_+-={}|[]\\:";\'<>?,./ \r\n\t';
const NAME_BREAKING_CHARACTERS = '`~!@#$%^&*()+={}|[]\\:";\'<>?,./ \r\n\t';
const SPACE_CHARACTERS = ' \r\n\t';
const COMMANDS = ['DO', 'SAY'];
const DEFAULT_COMMAND = 'SAY';
const IGNORED_TOKENS = ['THEN'];

export interface ParsedCommandResult {
    length: number;
    command?: PredictedCommand;
}

export class ResponseParser {
    public static parseAdaptiveCard(text?: string): Record<string, any> | undefined {
        let card: Record<string, any> | undefined;
        try {
            if (text) {
                const startJson = text.indexOf('{');
                const endJson = text.lastIndexOf('}');
                if (startJson >= 0 && endJson > startJson) {
                    const txt = text.substring(startJson, endJson + 1);
                    const obj: Record<string, any> = JSON.parse(txt);
                    if (obj['type'] === 'AdaptiveCard') {
                        card = obj;
                    }
                }
            }
        } catch (err) {
            // no action
        }

        return card;
    }

    public static parseResponse(text?: string): PredictedCommand[] {
        const commands: PredictedCommand[] = [];
        let tokens = this.tokenizeText(text);
        if (tokens.length > 0) {
            // Insert default command if response doesn't start with a command
            if (COMMANDS.indexOf(tokens[0]) < 0) {
                tokens = [DEFAULT_COMMAND].concat(tokens);
            }

            while (tokens.length > 0) {
                // Parse command
                let result: ParsedCommandResult;
                switch (tokens[0]) {
                    case 'DO':
                        result = this.parseDoCommand(tokens);
                        break;
                    case 'SAY':
                    default:
                        result = this.parseSayCommand(tokens);
                        break;
                }

                // Did we get a command back?
                if (result.length > 0) {
                    // Add command to list if generated
                    // - In the case of `DO DO command` the first DO command wouldn't generate
                    if (result.command) {
                        commands.push(result.command);
                    }

                    // Remove consumed tokens
                    tokens = result.length < tokens.length ? tokens.slice(result.length) : [];
                } else {
                    // Ignore remaining tokens as something is malformed
                    tokens = [];
                }
            }
        }

        return commands;
    }

    public static parseDoCommand(tokens: string[]): ParsedCommandResult {
        let length = 0;
        let command: PredictedDoCommand | undefined;
        if (tokens.length > 1) {
            if (tokens[0] != 'DO') {
                throw new Error(`ResponseParse.parseDoCommand(): token list passed in doesn't start with 'DO' token.`);
            }

            // Parse command (skips initial DO token)
            let actionName = '';
            let entityName = '';
            let entityValue = '';
            let quoteType = '';
            let parseState: DoCommandParseState = DoCommandParseState.findActionName;
            while (++length < tokens.length) {
                // Check for ignored tokens
                const token = tokens[length];
                if (IGNORED_TOKENS.indexOf(token) >= 0) {
                    continue;
                }

                // Stop processing if a new command is hit
                // - Ignored if in a quoted string
                if (COMMANDS.indexOf(token) >= 0 && parseState != DoCommandParseState.inEntityStringValue) {
                    break;
                }

                // Check for beginning of another command
                switch (parseState as DoCommandParseState) {
                    case DoCommandParseState.findActionName:
                    default:
                        // Ignore leading breaking characters
                        if (BREAKING_CHARACTERS.indexOf(token) < 0) {
                            // Assign token to action name and enter new state
                            actionName = token;
                            parseState = DoCommandParseState.inActionName;
                        }
                        break;
                    case DoCommandParseState.inActionName:
                        // Accumulate tokens until you hit a breaking character
                        // - Underscores and dashes are allowed
                        if (NAME_BREAKING_CHARACTERS.indexOf(token) >= 0) {
                            // Initialize command object and enter new state
                            command = {
                                type: 'DO',
                                action: actionName,
                                data: {}
                            };
                            parseState = DoCommandParseState.findEntityName;
                        } else {
                            actionName += token;
                        }
                        break;
                    case DoCommandParseState.findEntityName:
                        // Ignore leading breaking characters
                        if (BREAKING_CHARACTERS.indexOf(token) < 0) {
                            // Assign token to entity name and enter new state
                            entityName = token;
                            parseState = DoCommandParseState.inEntityName;
                        }
                        break;
                    case DoCommandParseState.inEntityName:
                        // Accumulate tokens until you hit a breaking character
                        // - Underscores and dashes are allowed
                        if (NAME_BREAKING_CHARACTERS.indexOf(token) >= 0) {
                            // We know the entity name so now we need the value
                            parseState = DoCommandParseState.findEntityValue;
                        } else {
                            entityName += token;
                        }
                        break;
                    case DoCommandParseState.findEntityValue:
                        // Look for either string quotes first non-space or equals token
                        if (token == '"' || token == "'" || token == "`") {
                            // Check for content value
                            if (token == "`" && tokens[length + 1] == "`" && tokens[length + 2] == "`") {
                                length += 2;
                                parseState = DoCommandParseState.inEntityContentValue;
                            } else {
                                // Remember quote type and enter new state
                                quoteType = token;
                                parseState = DoCommandParseState.inEntityStringValue;
                            }
                        } else if (SPACE_CHARACTERS.indexOf(token) < 0 && token != '=') {
                            // Assign token to value and enter new state
                            entityValue = token;
                            parseState = DoCommandParseState.inEntityValue;
                        }
                        break;
                    case DoCommandParseState.inEntityStringValue:
                        // Accumulate tokens until end of string is hit
                        if (token == quoteType) {
                            // Save pair and look for additional pairs
                            command!.data[entityName] = entityValue;
                            parseState = DoCommandParseState.findEntityName;
                            entityName = entityValue = '';
                        } else {
                            entityValue += token;
                        }
                        break;
                    case DoCommandParseState.inEntityContentValue:
                        if (token == "`" && tokens[length + 1] == "`" && tokens[length + 2] == "`") {
                            // Save pair and look for additional pairs
                            length += 2;
                            command!.data[entityName] = entityValue;
                            parseState = DoCommandParseState.findEntityName;
                            entityName = entityValue = '';
                        } else {
                            entityValue += token;
                        }
                        break;
                    case DoCommandParseState.inEntityValue:
                        // Accumulate tokens until you hit a space
                        if (SPACE_CHARACTERS.indexOf(token) >= 0) {
                            // Save pair and look for additional pairs
                            command!.data[entityName] = entityValue;
                            parseState = DoCommandParseState.findEntityName;
                            entityName = entityValue = '';
                        } else {
                            entityValue += token;
                        }
                        break;
                }
            }

            // Create command if not created
            // - This happens when a DO command without any entities is at the end of the response.
            if (!command && actionName) {
                command = {
                    type: 'DO',
                    action: actionName,
                    data: {}
                };
            }

            // Append final entity
            if (command && entityName) {
                command.data[entityName] = entityValue;
            }
        }

        return { length, command };
    }

    public static parseSayCommand(tokens: string[]): ParsedCommandResult {
        let length = 0;
        let command: PredictedSayCommand | undefined;
        if (tokens.length > 1) {
            if (tokens[0] != 'SAY') {
                throw new Error(
                    `ResponseParse.parseSayCommand(): token list passed in doesn't start with 'SAY' token.`
                );
            }

            // Parse command (skips initial DO token)
            let response = '';
            while (++length < tokens.length) {
                // Check for ignored tokens
                const token = tokens[length];
                if (IGNORED_TOKENS.indexOf(token) >= 0) {
                    continue;
                }

                // Stop processing if a new command is hit
                if (COMMANDS.indexOf(token) >= 0) {
                    break;
                }

                // Append token to output response
                response += token;
            }

            // Create command
            if (response.length > 0) {
                command = {
                    type: 'SAY',
                    response: response
                };
            }
        }

        return { length, command };
    }

    /**
     * Simple text tokenizer. Breaking characters are added to list as separate tokens.
     *
     * @param text Optional. Text string to tokenize.
     * @returns Array of tokens.
     */
    public static tokenizeText(text?: string): string[] {
        const tokens: string[] = [];
        if (text) {
            let token = '';
            const len = text.length;
            for (let i = 0; i < len; i++) {
                const ch = text[i];
                if (BREAKING_CHARACTERS.indexOf(ch) >= 0) {
                    // Push token onto list
                    if (token.length > 0) {
                        tokens.push(token);
                    }

                    // Push breaking character onto list as a separate token
                    tokens.push(ch);

                    // Start a new empty token
                    token = '';
                } else {
                    // Add to existing token
                    token += ch;
                }
            }

            // Push last token onto list
            if (token.length > 0) {
                tokens.push(token);
            }
        }

        return tokens;
    }
}

enum DoCommandParseState {
    findActionName,
    inActionName,
    findEntityName,
    inEntityName,
    findEntityValue,
    inEntityValue,
    inEntityStringValue,
    inEntityContentValue
}
