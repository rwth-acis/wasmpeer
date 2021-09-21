'use strict';
import Storage from './storage.js';

const _keyvalueStoreId = '_store';
const _sourceId = '_source';
const _rawId = '_raw';
const _metaId = '_meta';
export default class Manager {
    constructor(storage) {
        this.storage = storage;
    }

    async storeService(filename, object, objectRaw, objectMeta) {
        const source = await this.storage.create(filename, object);
        const raw = await this.storage.create(null, objectRaw);
        const meta = await this.storage.create(null, JSON.stringify(objectMeta, null, 2));
        const store = await this.storage.create(null, JSON.stringify({}, null, 2));

        const detail = JSON.stringify({
            [_keyvalueStoreId]: store.id,
            [_sourceId]: source.id,
            [_rawId]: raw.id,
            [_metaId]: meta.id
        }, null, 2);

        const entry = await this.storage.create(filename, detail);

        return entry.id;
    }

    async getService(id) {
        const entry = await this.storage.getJSON(id);
        const source = await this.storage.get(entry[_sourceId]);        
        const store = await this.storage.getJSON(entry[_keyvalueStoreId]);
        const meta = await this.storage.getJSONSafe(entry[_metaId]);
        return {
            sourceId: entry[_sourceId],
            storeId: entry[_keyvalueStoreId],
            metaId: entry[_metaId],
            source: source,
            store: store,
            meta: meta
        };
    }

    async updateService(id, object) {
        const entry = await this.storage.getJSON(id);
        await this.storage.update(entry[_sourceId], object);
    }

    update(id, object) {
        return this.storage.update(id, object);
    }

    read(id) {
        return this.storage.getJSON(id);
    }

    createWithId(id, name, object) {
        return this.storage.createWithId(id, name, object);
    }
}
