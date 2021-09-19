'use strict';
import Catalog from './catalog.js';

const storeFileIdentifier = '_store';
const sourceFileIdentifier = '_source';
export default class Storage {
    constructor(accessor) {
        this.catalog = new Catalog(accessor);
    }

    async storeService(filename, object) {
        const source = await this.catalog.create(filename, object);
        const store = await this.catalog.create(null, JSON.stringify({}, null, 2));

        const detail = JSON.stringify({
            [storeFileIdentifier]: store.id,
            [sourceFileIdentifier]: source.id
        }, null, 2);

        const entry = await this.catalog.create(filename, detail);

        return entry.id;
    }

    async getService(id) {
        const entry = await this.catalog.getJSON(id);
        const source = await this.catalog.get(entry[sourceFileIdentifier]);
        const store = await this.catalog.getJSON(entry[storeFileIdentifier]);

        return {
            sourceId: entry[sourceFileIdentifier],
            storeId: entry[storeFileIdentifier],
            source: source,
            store: store
        };
    }

    async updateService(id, object) {
        const entry = await this.catalog.getJSON(id);
        await this.catalog.update(entry[sourceFileIdentifier], object);
    }

    update(id, object) {
        return this.catalog.update(id, object);
    }

    read(id) {
        return this.catalog.getJSON(id);
    }

    createWithId(id, name, object) {
        return this.catalog.createWithId(id, name, object);
    }
}
