/* eslint-disable security/detect-object-injection */
import { MemoryStorage, StoreItems, StoreItem } from 'botbuilder';
import { BlobsStorage } from 'botbuilder-azure-blobs';

export class LastWriterWinsStore extends BlobsStorage {
    public write(changes: StoreItems): Promise<void> {
        // Remove any eTags
        for (const key in changes) {
            const item = changes[key] as StoreItem;
            if (item.eTag) {
                delete item.eTag;
            }
        }

        return super.write(changes);
    }
}
export class LastWriterWinsMemoryStore extends MemoryStorage {
    public write(changes: StoreItems): Promise<void> {
        // Remove any eTags
        for (const key in changes) {
            const item = changes[key] as StoreItem;
            if (item.eTag) {
                delete item.eTag;
            }
        }

        return super.write(changes);
    }
}
