import { StopCommandName } from './StopCommandName';

/**
 * @private
 */
export function flaggedInput() {
    return async () => {
        console.error(
            `The users input has been moderated but no handler was registered for 'AI.FlaggedInputActionName'.`
        );
        return StopCommandName;
    };
}
