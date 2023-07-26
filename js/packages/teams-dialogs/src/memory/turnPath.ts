/**
 * @module botbuilder-dialogs
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Defines path for avaiable turns.
 */
export class TurnPath {
    /// The result from the last dialog that was called.
    static readonly lastResult = 'turn.lastresult';

    /// The current activity for the turn.
    static readonly activity = 'turn.activity';

    /// The recognized result for the current turn.
    static readonly recognized = 'turn.recognized';

    /// Path to the top intent.
    static readonly topIntent = 'turn.recognized.intent';

    /// Path to the top score.
    static readonly topScore = 'turn.recognized.score';

    /// Original text.
    static readonly text = 'turn.recognized.text';

    /// Original utterance split into unrecognized strings.
    static readonly unrecognizedText = 'turn.unrecognizedText';

    /// Entities that were recognized from text.
    static readonly recognizedEntities = 'turn.recognizedEntities';

    /// If true an interruption has occured.
    static readonly interrupted = 'turn.interrupted';

    /// The current dialog event (set during event processings).
    static readonly dialogEvent = 'turn.dialogEvent';

    /// Used to track that we don't end up in infinite loop of RepeatDialogs().
    static readonly repeatedIds = 'turn.repeatedIds';

    /// This is a bool which if set means that the turncontext.activity has been consumed by some component in the system.
    static readonly activityProcessed = 'turn.activityProcessed';
}
