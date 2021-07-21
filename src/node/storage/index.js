'use strict';

import Catalog from './catalog';

const storeFileIdentifier = '_store';
const sourceFileIdentifier = '_source';
export default class Storage {
    constructor(instanceId) {
        this.catalog = new Catalog(instanceId);
    }

    storeService(filename, object) {
        const source = this.catalog.create(filename, object);
        const store = this.catalog.create(null, JSON.stringify({}, null, 0));

        const detail = JSON.stringify({
            [storeFileIdentifier]: store.id,
            [sourceFileIdentifier]: source.id
        }, null, 2);

        const entry = this.catalog.create(filename, detail);

        return entry.id;
    }

    getService(id) {
        const entry = this.catalog.getJSON(id);
        const source = this.catalog.get(entry[sourceFileIdentifier]);
        const store = this.catalog.getJSON(entry[storeFileIdentifier]);

        return {
            sourceId: entry[sourceFileIdentifier],
            storeId: entry[storeFileIdentifier],
            source: source,
            store: store
        };
    }

    updateService(id, object) {
        const entry = this.catalog.getJSON(id);
        this.catalog.update(entry[sourceFileIdentifier], object);
    }

    update(id, object) {
        this.catalog.update(id, object);
    }

    read(id) {
        const entry = this.catalog.getJSON(id);
        return this.catalog.get(entry.path);
    }
}