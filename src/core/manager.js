'use strict';

const _keyvalueStoreId = '_store';
const _sourceId = '_source';
const _rawId = '_raw';
const _metaId = '_meta';

export default class Manager {
    constructor(instanceId, storage, communicator, compiler) {
        this.instanceId = instanceId;
        this.storage = storage;
        this.communicator = communicator;
        this.compiler = compiler;

        this.db = {};
    }

    async uploadAS(filename, object) {
        const service = await this.compiler.AS(object.toString());
        const id = await this.storeService(filename, service.source, service.raw, service.meta);
        return id;
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

        let entry = null;
        if (this.communicator) {
            const fileAdded = await this.communicator.node.add({
                path: filename,
                content: detail
            }, {
                wrapWithDirectory: true
            })
            const key = fileAdded.cid.toString();

            await this.communicator.getFile(this.communicator.info.id.toString(), key);
            entry = await this.storage.createWithId(key, filename, detail);
        } else {
            entry = await this.storage.create(filename, detail);
        }

        return entry.id;
    }

    getAvailableServices() {
        return this.connector.getAvailableServices();
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
