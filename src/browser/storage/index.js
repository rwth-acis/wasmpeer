'use strict';
// REMARK: this is still a duplicate of storage in node.js.
// later will be moved to core components since this could be an interface
import Catalog from './catalog';

const storeFileIdentifier = '_store';
const sourceFileIdentifier = '_source';
export default class Storage {
    constructor(catalog) {
        this.catalog = catalog;
    }

    static async build(instanceId) {
        const catalog = await Catalog.build(instanceId);
        return new Storage(catalog);
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

    async read(id) {
        const entry = await this.catalog.getJSON(id);
        return entry;
    }
}
