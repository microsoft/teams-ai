/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * General information about a read receipt.
 */
export class ReadReceiptInfo {
    /**
     * The id of the last read message.
     */
    lastReadMessageId: string;

    /**
     * Initializes a new instance of the ReadReceiptInfo class.
     *
     * @param lastReadMessageId Optional. The id of the last read message.
     */
    constructor(lastReadMessageId?: string) {
        this.lastReadMessageId = lastReadMessageId!;
    }

    /**
     * Helper method useful for determining if a message has been read. This method
     * converts the strings to numbers. If the compareMessageId is less than or equal to
     * the lastReadMessageId, then the message has been read.
     *
     * @param compareMessageId The id of the message to compare.
     * @param lastReadMessageId The id of the last message read by the user.
     * @returns True if the compareMessageId is less than or equal to the lastReadMessageId.
     */
    static isMessageRead(compareMessageId: string, lastReadMessageId: string): boolean {
        if (
            compareMessageId &&
            compareMessageId.trim().length > 0 &&
            lastReadMessageId &&
            lastReadMessageId.trim().length > 0
        ) {
            const compareMessageIdNum = Number(compareMessageId);
            const lastReadMessageIdNum = Number(lastReadMessageId);

            if (compareMessageIdNum && lastReadMessageIdNum) {
                return compareMessageIdNum <= lastReadMessageIdNum;
            }
        }
        return false;
    }

    /**
     * Helper method useful for determining if a message has been read.
     * If the compareMessageId is less than or equal to the lastReadMessageId, then the message has been read.
     *
     * @param compareMessageId The id of the message to compare.
     * @returns True if the compareMessageId is less than or equal to the lastReadMessageId.
     */
    isMessageRead(compareMessageId: string): boolean {
        return ReadReceiptInfo.isMessageRead(compareMessageId, this.lastReadMessageId);
    }
}
