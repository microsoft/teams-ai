import { StopCommandName } from './StopCommandName';

/**
 * @private
 */
export function flaggedOutput() {
    return async () => {
        console.error(
            `The bots output has been moderated but no handler was registered for 'AI.FlaggedOutputActionName'.`
        );
        return StopCommandName;
    };
}
