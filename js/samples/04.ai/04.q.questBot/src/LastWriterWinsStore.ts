import { MemoryStorage, StoreItems, StoreItem } from 'botbuilder';

export class LastWriterWinsStore extends MemoryStorage {
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